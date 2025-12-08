1. Users & Authentication
-- =============================================
CREATE TYPE user_role AS ENUM ('UHWF_MEMBER', 'CITIZEN', 'EMPLOYEE', 'STUDENT');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'CITIZEN',
    is_active BOOLEAN DEFAULT true,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    profile_picture_url TEXT,
    bio TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- =============================================
-- 2. Staff / Admin Permissions (only for role = EMPLOYEE)
-- =============================================
CREATE TYPE staff_level AS ENUM (
    'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 
    'FINANCE_OFFICER', 'CONTENT_APPROVER'
);

CREATE TABLE staff_members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_level staff_level NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Granular permissions
    can_manage_users BOOLEAN DEFAULT false,
    can_manage_roles BOOLEAN DEFAULT false,
    can_view_all_payments BOOLEAN DEFAULT false,
    can_refund_payments BOOLEAN DEFAULT false,
    can_approve_documents BOOLEAN DEFAULT false,
    can_delete_documents BOOLEAN DEFAULT false,
    can_moderate_forums BOOLEAN DEFAULT false,
    can_ban_users BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT false,
    can_manage_events BOOLEAN DEFAULT false,
    can_impersonate_users BOOLEAN DEFAULT false, -- only SUPER_ADMIN

    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by BIGINT REFERENCES users(id),
    notes TEXT
);

CREATE INDEX idx_staff_user ON staff_members(user_id);
CREATE INDEX idx_staff_level ON staff_members(staff_level);

-- =============================================
-- 3. Payments & Transactions
-- =============================================
CREATE TYPE payment_method AS ENUM ('MPESA', 'AIRTEL_MONEY', 'CARD', 'BANK');
CREATE TYPE payment_purpose AS ENUM ('MEMBERSHIP_FEE', 'EVENT_REGISTRATION', 'DONATION', 'OTHER');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) DEFAULT 'KES',
    payment_method payment_method NOT NULL,
    transaction_ref VARCHAR(100) UNIQUE,           -- M-Pesa: RX... , Card: token
    purpose payment_purpose NOT NULL,
    purpose_details TEXT,
    status payment_status DEFAULT 'PENDING',
    receipt_url TEXT,
    metadata JSONB,                                -- raw callback from provider
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    refunded_at TIMESTAMP
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_date ON payments(initiated_at DESC);

-- =============================================
-- 4. Documents & Research Outputs
-- =============================================
CREATE TYPE document_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    status document_status DEFAULT 'PENDING_REVIEW',
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    version INTEGER DEFAULT 1,
    parent_document_id BIGINT REFERENCES documents(id),
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- =============================================
-- 5. Document Approval Workflow History
-- =============================================
CREATE TABLE document_approvals (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    status document_status NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 6. Forum Categories
-- =============================================
CREATE TABLE forum_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    allowed_roles TEXT[] DEFAULT '{CITIZEN,STUDENT,UHWF_MEMBER,EMPLOYEE}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 7. Forum Threads
-- =============================================
CREATE TABLE forum_threads (
    id BIGSERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) GENERATED ALWAYS AS (lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))) STORED,
    author_id BIGINT NOT NULL REFERENCES users(id),
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threads_category ON forum_threads(category_id);
CREATE INDEX idx_threads_pinned ON forum_threads(is_pinned, last_activity_at DESC);
CREATE INDEX idx_threads_activity ON forum_threads(last_activity_at DESC);

-- =============================================
-- 8. Forum Posts
-- =============================================
CREATE TABLE forum_posts (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_post_id BIGINT REFERENCES forum_posts(id), -- nested replies
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_thread ON forum_posts(thread_id);
CREATE INDEX idx_posts_author ON forum_posts(author_id);

-- =============================================
-- 9. Events
-- =============================================
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) GENERATED ALWAYS AS (lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))) STORED,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    registration_fee DECIMAL(10,2) DEFAULT 0,
    registration_deadline TIMESTAMP,
    max_attendees INTEGER,
    created_by BIGINT REFERENCES users(id),
    banner_url TEXT,
    status event_status DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 10. Event Registrations
-- =============================================
CREATE TABLE event_registrations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id BIGINT REFERENCES payments(id),
    attended BOOLEAN DEFAULT false,
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- =============================================
-- 11. Analytics Datasets (for public visualizations)
-- =============================================
CREATE TABLE analytics_datasets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    file_url TEXT,                    -- optional CSV/Excel upload
    uploaded_by BIGINT REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Done! Seed your first super admin:
-- =============================================
-- Example (after creating the first user manually):
-- INSERT INTO staff_members (user_id, staff_level, can_manage_users, can_manage_roles, ...)
-- VALUES (1, 'SUPER_ADMIN', true, true, true, true, true, true, true, true, true, true, true);