-- Step 1: Rename the original Grants table
ALTER TABLE Grants RENAME TO Grants_old;

-- Step 2: Recreate the new Grants table with updated columns
CREATE TABLE Grants (
    grant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Copy relevant data (excluding dropped columns)
INSERT INTO Grants (grant_id, title, description, status, website, created_at, updated_at)
SELECT grant_id, title, description, status, website, created_at, updated_at
FROM Grants_old;

-- Step 4: Drop the old Grants table
DROP TABLE Grants_old;

-- Step 5: Drop and recreate dependent tables
DROP TABLE IF EXISTS GrantFunding;
DROP TABLE IF EXISTS FundingOpportunities;
DROP TABLE IF EXISTS GrantTimelines;

-- Step 6: Recreate GrantTimelines
CREATE TABLE GrantTimelines (
    timeline_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    details TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Step 7: Recreate FundingOpportunities
CREATE TABLE FundingOpportunities (
    funding_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT,
    description TEXT,
    total_funding_amount REAL,
    max_award_amount REAL,
    application_deadline DATE,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 8: Recreate GrantFunding join table
CREATE TABLE GrantFunding (
    grant_id INTEGER NOT NULL,
    funding_id INTEGER NOT NULL,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE,
    FOREIGN KEY (funding_id) REFERENCES FundingOpportunities(funding_id) ON DELETE CASCADE,
    PRIMARY KEY (grant_id, funding_id)
);