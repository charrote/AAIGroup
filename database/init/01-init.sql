-- AI Company Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Characters table
CREATE TABLE IF NOT EXISTS ai_characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    description TEXT,
    personality TEXT,
    skills TEXT[], -- Array of skills
    prompt_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'proposed', -- proposed, approved, in_progress, completed, cancelled
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high
    budget DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Teams table (many-to-many relationship between projects and AI characters)
CREATE TABLE IF NOT EXISTS project_teams (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES ai_characters(id) ON DELETE CASCADE,
    role_in_project VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, character_id)
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    context TEXT,
    options JSONB, -- JSON array of decision options
    recommendation JSONB, -- AI recommendation
    final_decision JSONB, -- User's final decision
    status VARCHAR(20) DEFAULT 'proposed', -- proposed, approved, rejected
    created_by INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Decision Votes table
CREATE TABLE IF NOT EXISTS decision_votes (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER REFERENCES decisions(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES ai_characters(id) ON DELETE CASCADE,
    vote JSONB, -- JSON object containing the vote
    reasoning TEXT,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(decision_id, character_id)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- human, financial, physical, digital
    description TEXT,
    availability VARCHAR(20) DEFAULT 'available', -- available, in_use, unavailable
    cost DECIMAL(10, 2),
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Resources table (many-to-many relationship between projects and resources)
CREATE TABLE IF NOT EXISTS project_resources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5, 2),
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, resource_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo', -- todo, in_progress, completed, cancelled
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES ai_characters(id),
    created_by INTEGER REFERENCES users(id),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default AI characters
INSERT INTO ai_characters (name, role, description, personality, skills, prompt_template) VALUES
('Alex Chen', 'Market Analyst', 'Specializes in market research and trend analysis', 'Analytical, detail-oriented, data-driven', ARRAY['market research', 'data analysis', 'trend forecasting'], 'You are Alex Chen, a market analyst with expertise in identifying market trends and opportunities. Always provide data-driven insights and consider multiple perspectives.'),
('Sarah Johnson', 'Product Designer', 'Creative product designer with user experience focus', 'Creative, empathetic, user-focused', ARRAY['product design', 'UX/UI', 'prototyping'], 'You are Sarah Johnson, a product designer focused on creating intuitive and user-friendly solutions. Always consider the end-user experience in your recommendations.'),
('Michael Lee', 'Technical Expert', 'Software architect and technical problem solver', 'Logical, systematic, solution-oriented', ARRAY['software architecture', 'system design', 'technical problem solving'], 'You are Michael Lee, a technical expert who can evaluate technical feasibility and design robust solutions. Always consider scalability and maintainability.'),
('Emily Davis', 'Project Manager', 'Experienced project manager with organizational skills', 'Organized, pragmatic, deadline-focused', ARRAY['project management', 'team coordination', 'resource planning'], 'You are Emily Davis, a project manager who excels at organizing resources and meeting deadlines. Always consider resource constraints and timeline implications.'),
('David Wilson', 'Strategic Advisor', 'Business strategist with long-term vision', 'Strategic, forward-thinking, business-focused', ARRAY['business strategy', 'market positioning', 'growth planning'], 'You are David Wilson, a strategic advisor who focuses on long-term business implications. Always consider how decisions align with overall business goals.');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON project_resources(project_id);