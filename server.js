/**
 * CampusExchange Authentication & API Server
 * 
 * Genuine authentication backend implementing:
 * - Scrypt cryptographic password hashing with 16-byte random salts
 * - Constant-time timing-safe hash comparison
 * - Cryptographically random session tokens
 * - JSON-based persistence in ./data/
 * - CORS support for local dev and VS Code Live Server
 * - Zero external npm dependencies (uses standard Node.js libraries)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]), "utf8");
}
if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}), "utf8");
}

function loadUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function loadSessions() {
    try {
        return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
    } catch {
        return {};
    }
}

function saveSessions(sessions) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf8");
}

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password, salt, storedHash) {
    const computedHash = hashPassword(password, salt);
    const storedBuf = Buffer.from(storedHash, "hex");
    const computedBuf = Buffer.from(computedHash, "hex");
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
}

function createSession(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const sessions = loadSessions();
    sessions[token] = {
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
    };
    saveSessions(sessions);
    return token;
}

function getSessionUser(token) {
    if (!token) return null;
    const sessions = loadSessions();
    const session = sessions[token];
    if (!session) return null;
    if (session.expiresAt && Date.now() > session.expiresAt) {
        delete sessions[token];
        saveSessions(sessions);
        return null;
    }
    const users = loadUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
}

function revokeSession(token) {
    if (!token) return;
    const sessions = loadSessions();
    delete sessions[token];
    saveSessions(sessions);
}

function sendJSON(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end(JSON.stringify(data));
}

function parseJSONBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
            if (body.length > 1e6) {
                req.connection.destroy();
                reject(new Error("Request payload too large"));
            }
        });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on("error", reject);
    });
}

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml"
};

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        });
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = parsedUrl.pathname;

    // API Routes
    if (pathname === "/api/auth/signup" && req.method === "POST") {
        try {
            const { name, email, password } = await parseJSONBody(req);
            const cleanName = (name || "").trim();
            const cleanEmail = (email || "").trim().toLowerCase();

            if (!cleanName || cleanName.length < 2) {
                return sendJSON(res, 400, { error: "Please enter your full name (at least 2 characters)." });
            }
            if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                return sendJSON(res, 400, { error: "Please enter a valid email address." });
            }
            if (!password || password.length < 6) {
                return sendJSON(res, 400, { error: "Password must be at least 6 characters long." });
            }

            const users = loadUsers();
            if (users.some(u => u.email === cleanEmail)) {
                return sendJSON(res, 409, { error: "An account with this email already exists." });
            }

            const salt = crypto.randomBytes(16).toString("hex");
            const hash = hashPassword(password, salt);
            const newUser = {
                id: "usr_" + crypto.randomBytes(8).toString("hex"),
                name: cleanName,
                email: cleanEmail,
                salt,
                hash,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveUsers(users);

            const token = createSession(newUser.id);
            return sendJSON(res, 201, {
                success: true,
                token,
                user: { id: newUser.id, name: newUser.name, email: newUser.email }
            });
        } catch (err) {
            console.error("Signup error:", err);
            return sendJSON(res, 500, { error: "Internal server error during registration." });
        }
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
        try {
            const { email, password } = await parseJSONBody(req);
            const cleanEmail = (email || "").trim().toLowerCase();

            if (!cleanEmail || !password) {
                return sendJSON(res, 400, { error: "Email and password are required." });
            }

            const users = loadUsers();
            const user = users.find(u => u.email === cleanEmail);
            if (!user) {
                return sendJSON(res, 401, { error: "Invalid email or password." });
            }

            if (!verifyPassword(password, user.salt, user.hash)) {
                return sendJSON(res, 401, { error: "Invalid email or password." });
            }

            const token = createSession(user.id);
            return sendJSON(res, 200, {
                success: true,
                token,
                user: { id: user.id, name: user.name, email: user.email }
            });
        } catch (err) {
            console.error("Login error:", err);
            return sendJSON(res, 500, { error: "Internal server error during login." });
        }
    }

    if (pathname === "/api/auth/session" && req.method === "GET") {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        const user = getSessionUser(token);
        if (!user) {
            return sendJSON(res, 401, { error: "Session expired or invalid." });
        }
        return sendJSON(res, 200, { success: true, user });
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        revokeSession(token);
        return sendJSON(res, 200, { success: true });
    }

    // Static file serving for standalone mode
    let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 Not Found");
            } else {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("500 Server Error");
            }
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content, "utf-8");
        }
    });
});

server.listen(PORT, () => {
    console.log(`CampusExchange backend running at http://127.0.0.1:${PORT}`);
    console.log(`Auth endpoints available at http://127.0.0.1:${PORT}/api/auth`);
});
