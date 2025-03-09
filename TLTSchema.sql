-- Table for Grant Categories
CREATE TABLE GrantCategories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    definition_link VARCHAR(255)
);

-- Main Grants table
CREATE TABLE Grants (
    grant_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    status VARCHAR(50),
    website VARCHAR(255),
    award_details TEXT,
    interview_required BOOLEAN DEFAULT FALSE,
    rolling_basis BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES GrantCategories(category_id) ON DELETE SET NULL
);

-- Table for tracking timelines/events of the grant process
CREATE TABLE GrantTimelines (
    timeline_id INT PRIMARY KEY AUTO_INCREMENT,
    grant_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    details TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for application requirements and guidelines
CREATE TABLE ApplicationRequirements (
    requirement_id INT PRIMARY KEY AUTO_INCREMENT,
    grant_id INT NOT NULL,
    eligibility TEXT,
    materials TEXT,
    instructions TEXT,
    notes TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for contact information related to the grant
CREATE TABLE Contacts (
    contact_id INT PRIMARY KEY AUTO_INCREMENT,
    grant_id INT NOT NULL,
    contact_type VARCHAR(50),
    contact_info VARCHAR(255),
    availability VARCHAR(100),
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for specific grant stipulations or conditions
CREATE TABLE GrantStipulations (
    stipulation_id INT PRIMARY KEY AUTO_INCREMENT,
    grant_id INT NOT NULL,
    condition TEXT,
    notes TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE
);

-- Table for Funding Opportunities
CREATE TABLE FundingOpportunities (
    funding_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(255),  -- Organization or entity providing the funding
    total_funding_amount DECIMAL(15,2),  -- Total funding available
    max_award_amount DECIMAL(15,2),  -- Maximum award per recipient
    application_deadline DATE,
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Relationship table linking Grants to Funding Opportunities
CREATE TABLE GrantFunding (
    grant_id INT NOT NULL,
    funding_id INT NOT NULL,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id) ON DELETE CASCADE,
    FOREIGN KEY (funding_id) REFERENCES FundingOpportunities(funding_id) ON DELETE CASCADE,
    PRIMARY KEY (grant_id, funding_id)
);
