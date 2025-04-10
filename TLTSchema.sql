-- Table for Grant Categories
CREATE TABLE GrantCategories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    definition_link TEXT
);

-- Main Grants table
CREATE TABLE Grants (
    grant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    status TEXT,
    website TEXT,
    award_details TEXT,
    interview_required INTEGER DEFAULT 0,
    rolling_basis INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES GrantCategories(category_id) ON DELETE SET NULL
);

-- Table for tracking timelines/events of the grant process
CREATE TABLE GrantTimelines (
    timeline_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    details TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for application requirements and guidelines
CREATE TABLE ApplicationRequirements (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id INTEGER NOT NULL,
    eligibility TEXT,
    materials TEXT,
    instructions TEXT,
    notes TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for contact information related to the grant
CREATE TABLE Contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id INTEGER NOT NULL,
    contact_type TEXT,
    contact_info TEXT,
    availability TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for specific grant stipulations or conditions
CREATE TABLE GrantStipulations (
    stipulation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id INTEGER NOT NULL,
    condition TEXT,
    notes TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for Funding Opportunities
CREATE TABLE FundingOpportunities (
    funding_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    source TEXT,
    total_funding_amount REAL,
    max_award_amount REAL,
    application_deadline DATE,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship table linking Grants to Funding Opportunities
CREATE TABLE GrantFunding (
    grant_id INTEGER NOT NULL,
    funding_id INTEGER NOT NULL,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE,
    FOREIGN KEY (funding_id) REFERENCES FundingOpportunities(funding_id) ON DELETE CASCADE,
    PRIMARY KEY (grant_id, funding_id)
);
