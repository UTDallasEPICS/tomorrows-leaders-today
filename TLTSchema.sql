-- Table for Grant Categories
CREATE TABLE GrantCategories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    definition_link VARCHAR(255)
);

-- Main Grants table
CREATE TABLE Grants (
    grant_id INT AUTO_INCREMENT PRIMARY KEY,
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
    FOREIGN KEY (category_id) REFERENCES GrantCategories(category_id)
);

-- Table for tracking timelines/events of the grant process
CREATE TABLE GrantTimelines (
    timeline_id INT AUTO_INCREMENT PRIMARY KEY,
    grant_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    details TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id)
);

-- Table for application requirements and guidelines
CREATE TABLE ApplicationRequirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    grant_id INT NOT NULL,
    eligibility TEXT,
    materials TEXT,
    instructions TEXT,
    notes TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id)
);

-- Table for contact information related to the grant
CREATE TABLE Contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    grant_id INT NOT NULL,
    contact_type VARCHAR(50),
    contact_info VARCHAR(255),
    availability VARCHAR(100),
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id)
);

-- Table for specific grant stipulations or conditions
CREATE TABLE GrantStipulations (
    stipulation_id INT AUTO_INCREMENT PRIMARY KEY,
    grant_id INT NOT NULL,
    condition TEXT,
    notes TEXT,
    FOREIGN KEY (grant_id) REFERENCES Grants(grant_id)
);
