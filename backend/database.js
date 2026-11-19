const Database = require("better-sqlite3");

const db = new Database("mahaconnect.db");

/* ==============================
   APPLICATIONS TABLE
============================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        service TEXT,
        name TEXT,
        email TEXT,
        mobile TEXT,
        fatherName TEXT,
        motherName TEXT,
        aadhaar TEXT,
        dob TEXT,
        district TEXT,
        taluk TEXT,
        address TEXT,
        education TEXT,
        income TEXT,
        status TEXT,
        date TEXT
    )
`).run();

/* ==============================
   SAFE MIGRATION
============================== */

function addColumnIfMissing(table, column, definition) {
    const columns = db
        .prepare("PRAGMA table_info(" + table + ")")
        .all();

    const exists = columns.some(function (col) {
        return col.name === column;
    });

    if (!exists) {
        db.prepare(
            "ALTER TABLE " + table +
            " ADD COLUMN " + column + " " + definition
        ).run();

        console.log("Database: added column '" + column + "'");
    }
}

addColumnIfMissing("applications", "serviceType", "TEXT");
addColumnIfMissing("applications", "serviceSpecificData", "TEXT");

/* ==============================
   CONSENT MANAGEMENT
============================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS consents (
        id TEXT PRIMARY KEY,
        applicationId TEXT,
        citizenEmail TEXT,
        department TEXT,
        dataRequested TEXT,
        purpose TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )
`).run();

/* ==============================
   DOCUMENT WALLET
============================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS wallet_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending'
            CHECK(status IN ('Pending', 'Verified', 'Rejected')),
        createdAt TEXT NOT NULL
    )
`).run();

/* ==============================
   SERVICE MANAGEMENT TABLE
============================== */

db.prepare(`
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        eligibility TEXT,
        requiredDocuments TEXT,
        applicationUrl TEXT,
        status TEXT NOT NULL DEFAULT 'Active'
            CHECK(status IN ('Active', 'Inactive')),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )
`).run();

console.log("MahaConnect Database Ready 🗄️");

module.exports = db;