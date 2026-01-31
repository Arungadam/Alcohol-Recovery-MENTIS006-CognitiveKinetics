        /**
         * RECOVER PEER APPLICATION LOGIC
         * Architecture: Single Page App (SPA)
         * Storage: localStorage (simulating encrypted database)
         * Security: Field-level visibility toggles, pseudonymity
         */

        // --- DATA STORE SIMULATION ---
        const DB = {
            users: JSON.parse(localStorage.getItem('rp_users')) || [],
            meetings: JSON.parse(localStorage.getItem('rp_meetings')) || [
                { id: 1, title: "Morning Reflection", time: "08:00 AM", type: "Open" },
                { id: 2, title: "Step Study", time: "06:00 PM", type: "Closed" }
            ],
            journals: JSON.parse(localStorage.getItem('rp_journals')) || [],
            alerts: JSON.parse(localStorage.getItem('rp_alerts')) || [], // Support requests

            save() {
                localStorage.setItem('rp_users', JSON.stringify(this.users));
                localStorage.setItem('rp_meetings', JSON.stringify(this.meetings));
                localStorage.setItem('rp_journals', JSON.stringify(this.journals));
                localStorage.setItem('rp_alerts', JSON.stringify(this.alerts));
            }
        };

        // --- APP CONTROLLER ---
        const app = {
            currentUser: null,
            currentTheme: 'light',

            init() {
                // Check for session
                const session = sessionStorage.getItem('rp_session');
                if (session) {
                    this.currentUser = JSON.parse(session);
                    this.loadDashboard();
                }

                // Event Listeners
                document.getElementById('login-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.login();
                });
                
                document.getElementById('register-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.register();
                });

                document.getElementById('quick-hide-btn').addEventListener('click', this.quickHide);
                document.addEventListener('keydown', (e) => {
                    if (e.key === "Escape") this.quickHide();
                });
                
                document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme);
            },

            // --- AUTHENTICATION ---
            register() {
                const username = document.getElementById('reg-username').value;
                const date = document.getElementById('reg-date').value;
                
                // Simple validation
                if (DB.users.find(u => u.username === username)) {
                    alert("Pseudonym taken. Please choose another.");
                    return;
                }

                const newUser = {
                    id: Date.now().toString(),
                    username: username,
                    role: 'participant', // Default role for new users
                    sobrietyDate: date || new Date().toISOString(),
                    joined: new Date().toISOString()
                };

                DB.users.push(newUser);
                DB.save();
                alert("Account created securely. Please login.");
                this.showPage('login');
            },

            login() {
                const username = document.getElementById('login-username').value;
                const role = document.getElementById('login-role').value;

                // Find or Mock User for Demo
                let user = DB.users.find(u => u.username === username);

                // If user doesn't exist in DB (fresh session or demo), create a temporary session user
                // In a real app, this would be password auth.
                if (!user) {
                    // For demo purposes, allow auto-login with any name if DB is empty
                    user = {
                        id: 'demo_' + Date.now(),
                        username: username,
                        role: role,
                        sobrietyDate: new Date().toISOString(),
                        joined: new Date().toISOString()
                    };
                    DB.users.push(user);
                    DB.save();
                } else {
                    // Override role for demo flexibility if selecting a different role for same user
                    user.role = role; 
                }

                this.currentUser = user;
                sessionStorage.setItem('rp_session', JSON.stringify(user));
                this.loadDashboard();
            },

            logout() {
                this.currentUser = null;
                sessionStorage.removeItem('rp_session');
                document.getElementById('dashboard-view').classList.add('hidden');
                document.getElementById('main-header').classList.add('hidden');
                document.getElementById('main-footer').classList.add('hidden');
                document.getElementById('auth-screen').classList.remove('hidden');
            },

            // --- NAVIGATION & ROUTING ---
            showPage(pageId) {
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('page-register').classList.add('hidden');
                document.getElementById('page-privacy').classList.add('hidden');
                document.getElementById('dashboard-view').classList.add('hidden');

                if (pageId === 'login') {
                    document.getElementById('auth-screen').classList.remove('hidden');
                } else if (pageId === 'register') {
                    document.getElementById('page-register').classList.remove('hidden');
                } else if (pageId === 'privacy') {
                    document.getElementById('page-privacy').classList.remove('hidden');
                } else if (pageId === 'dashboard') {
                    document.getElementById('dashboard-view').classList.remove('hidden');
                    document.getElementById('main-header').classList.remove('hidden');
                    document.getElementById('main-footer').classList.remove('hidden');
                }
            },

            // --- DASHBOARD RENDERER ---
            loadDashboard() {
                this.showPage('dashboard');
                const user = this.currentUser;
                
                // Header Info
                document.getElementById('welcome-msg').textContent = `Hello, ${user.username}`;
                document.getElementById('user-role-badge').textContent = user.role.toUpperCase();
                
                // Render Role-Specific Navigation
                this.renderNav(user.role);
                
                // Render Default View
                this.renderView('home');
            },

            renderNav(role) {
                const nav = document.getElementById('role-nav');
                nav.innerHTML = ''; // Clear

                const createLink = (id, label) => {
                    const btn = document.createElement('button');
                    btn.className = 'nav-link';
                    btn.textContent = label;
                    btn.onclick = () => app.renderView(id);
                    if (id === 'home') btn.classList.add('active');
                    return btn;
                };

                // Common Links
                nav.appendChild(createLink('home', 'Overview'));

                if (role === 'participant') {
                    nav.appendChild(createLink('journal', 'Encrypted Journal'));
                    nav.appendChild(createLink('meetings', 'Meetings'));
                    nav.appendChild(createLink('privacy-settings', 'Privacy Center'));
                } else if (role === 'sponsor') {
                    nav.appendChild(createLink('sponsees', 'Sponsee Check-ins'));
                    nav.appendChild(createLink('messages', 'Secure Messages'));
                } else if (role === 'facilitator') {
                    nav.appendChild(createLink('schedule', 'Schedule'));
                    nav.appendChild(createLink('group-notes', 'Group Notes'));
                } else if (role === 'admin') {
                    nav.appendChild(createLink('system', 'System Health'));
                }
            },

            renderView(viewId) {
                // Update Active Nav
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                // Find link roughly (simple match for demo)
                const links = Array.from(document.querySelectorAll('.nav-link'));
                const activeLink = links.find(l => l.textContent.toLowerCase().includes(viewId) || (viewId === 'home' && l.textContent === 'Overview'));
                if (activeLink) activeLink.classList.add('active');

                const container = document.getElementById('content-area');
                container.innerHTML = ''; // Clear

                const role = this.currentUser.role;

                // --- VIEW LOGIC ---

                if (role === 'participant') {
                    if (viewId === 'home') {
                        // Sobriety Calculator
                        const start = new Date(this.currentUser.sobrietyDate);
                        const now = new Date();
                        const diffTime = Math.abs(now - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                        
                        container.innerHTML = `
                            <div class="grid">
                                <div class="card text-center">
                                    <h3 class="text-muted">Sobriety Time</h3>
                                    <div class="sobriety-counter">${diffDays} Days</div>
                                    <button class="btn btn-outline mt-4 text-sm" onclick="app.updateDate()">Reset Date</button>
                                </div>
                                <div class="card flex flex-col justify-between">
                                    <h3>Quick Actions</h3>
                                    <button class="btn btn-danger" onclick="app.openModal('support-modal')">Request Support</button>
                                    <button class="btn btn-secondary mt-2" onclick="app.renderView('journal')">Write Reflection</button>
                                </div>
                            </div>
                            <div class="card mt-4">
                                <h3>Upcoming Meetings</h3>
                                <div id="home-meetings-list"></div>
                            </div>
                        `;
                        // Populate meetings
                        const list = document.getElementById('home-meetings-list');
                        DB.meetings.slice(0,2).forEach(m => {
                            list.innerHTML += `<div class="meeting-item">
                                <span><strong>${m.title}</strong></span>
                                <span class="badge badge-success">${m.time}</span>
                            </div>`;
                        });

                    } else if (viewId === 'journal') {
                        // Show journal entries + Add new
                        container.innerHTML = `
                            <div class="card">
                                <h3>Encrypted Journal</h3>
                                <p class="text-sm text-muted">Entries are end-to-end encrypted. Only you can see them.</p>
                                <textarea id="new-entry" rows="3" placeholder="How are you feeling today?"></textarea>
                                <button class="btn btn-primary" onclick="app.addJournalEntry()">Save Entry (Encrypted)</button>
                            </div>
                            <div class="mt-4" id="journal-list"></div>
                        `;
                        this.renderJournalList();

                    } else if (viewId === 'meetings') {
                        container.innerHTML = `<h3>Meeting Schedule</h3><div class="grid mt-4" id="all-meetings"></div>`;
                        const grid = document.getElementById('all-meetings');
                        DB.meetings.forEach(m => {
                            grid.innerHTML += `
                                <div class="card">
                                    <h4>${m.title}</h4>
                                    <p class="text-muted">${m.time} &bull; ${m.type}</p>
                                    <button class="btn btn-outline btn-sm mt-4">Log Anonymous Attendance</button>
                                </div>
                            `;
                        });
                    } else if (viewId === 'privacy-settings') {
                        container.innerHTML = `
                            <h3>Privacy Center</h3>
                            <div class="card mt-4">
                                <div class="privacy-toggle">
                                    <span>Visible to Sponsor</span>
                                    <label class="switch"><input type="checkbox" checked></label>
                                </div>
                                <div class="privacy-toggle">
                                    <span>Show Milestones Publicly</span>
                                    <label class="switch"><input type="checkbox"></label>
                                </div>
                                <div class="privacy-toggle">
                                    <span>Data Retention (Auto-delete journals after 1yr)</span>
                                    <label class="switch"><input type="checkbox" checked></label>
                                </div>
                            </div>
                            <div class="card mt-4" style="border-color: var(--danger);">
                                <h4>Danger Zone</h4>
                                <button class="btn btn-danger" onclick="if(confirm('Permanently delete all data?')) { localStorage.clear(); location.reload(); }">Delete All Data</button>
                                <button class="btn btn-outline" onclick="alert('Data exported to JSON (Simulated)')">Export Data</button>
                            </div>
                        `;
                    }
                }

                if (role === 'sponsor') {
                    if (viewId === 'home' || viewId === 'sponsees') {
                        container.innerHTML = `
                            <h3>Your Sponsees</h3>
                            <div class="grid mt-4">
                                <div class="card">
                                    <div class="flex flex-between">
                                        <strong>Alex_Member</strong>
                                        <span class="badge badge-success">Checking in</span>
                                    </div>
                                    <p class="text-sm text-muted mt-4">Last contact: 2 days ago</p>
                                    <div class="flex mt-4">
                                        <button class="btn btn-primary btn-sm">Send Message</button>
                                        <button class="btn btn-outline btn-sm">View Goals</button>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="flex flex-between">
                                        <strong>Sam_Recover</strong>
                                        <span class="badge badge-warning">Support Needed</span>
                                    </div>
                                    <p class="text-sm text-muted mt-4">Flagged: High risk</p>
                                    <div class="flex mt-4">
                                        <button class="btn btn-primary btn-sm">Contact Now</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else if (viewId === 'messages') {
                        container.innerHTML = `<h3>Secure Messages</h3><p class="text-muted">End-to-encrypted channel.</p>`;
                        container.innerHTML += `<div class="card mt-4"><p><strong>Alex_Member:</strong> Hey, I'm struggling with step 4.</p></div>`;
                    }
                }

                if (role === 'facilitator') {
                    if (viewId === 'home' || viewId === 'schedule') {
                        container.innerHTML = `
                            <h3>Facilitator Dashboard</h3>
                            <div class="grid mt-4">
                                <div class="card">
                                    <h4>Meeting Attendance (Aggregated)</h4>
                                    <div style="height: 100px; display:flex; align-items:flex-end; gap: 10px;">
                                        <div style="background:var(--primary); width: 30px; height: 60%;"></div>
                                        <div style="background:var(--primary); width: 30px; height: 80%;"></div>
                                        <div style="background:var(--primary); width: 30px; height: 40%;"></div>
                                    </div>
                                    <p class="text-sm text-muted mt-4">Trend: Stable participation. No individual identities logged.</p>
                                </div>
                                <div class="card">
                                    <h4>Actions</h4>
                                    <button class="btn btn-primary mb-4">Schedule New Meeting</button>
                                    <button class="btn btn-outline">Group Notes (Encrypted)</button>
                                </div>
                            </div>
                        `;
                    }
                }

                if (role === 'admin') {
                     if (viewId === 'home' || viewId === 'system') {
                        container.innerHTML = `
                            <h3>System Health (Technical Only)</h3>
                            <div class="grid mt-4">
                                <div class="card">
                                    <h4>Total Users</h4>
                                    <p class="text-sm">${DB.users.length}</p>
                                </div>
                                <div class="card">
                                    <h4>Encryption Status</h4>
                                    <p class="text-sm text-muted">Active (AES-256 Sim)</p>
                                </div>
                                <div class="card">
                                    <h4>Storage Usage</h4>
                                    <div style="background:#eee; height:10px; width:100%; border-radius:5px;">
                                        <div style="background:var(--secondary); height:10px; width:20%; border-radius:5px;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="card mt-4">
                                <h4>Audit Log (Security Events Only)</h4>
                                <ul class="text-sm text-muted">
                                    <li>User login: alex_member (10:00 AM)</li>
                                    <li>Encryption key rotation (Yesterday)</li>
                                    <li>Failed login attempt (Yesterday)</li>
                                </ul>
                            </div>
                            <p class="text-sm text-danger mt-4"><strong>Admin Access Restriction:</strong> Personal journals and support requests are not visible in this dashboard.</p>
                        `;
                     }
                }
            },

            // --- FEATURE IMPLEMENTATION ---
            
            // Sobriety Counter
            updateDate() {
                const newDate = prompt("Enter your sobriety date (YYYY-MM-DD):");
                if (newDate) {
                    this.currentUser.sobrietyDate = newDate;
                    // Update in DB array too
                    const idx = DB.users.findIndex(u => u.id === this.currentUser.id);
                    if (idx !== -1) DB.users[idx] = this.currentUser;
                    DB.save();
                    this.renderView('home');
                }
            },

            // Journal (Simulated Encryption)
            addJournalEntry() {
                const text = document.getElementById('new-entry').value;
                if (!text) return;

                // "Encrypt" (Base64 for demo purposes to show concept, real app uses WebCrypto)
                const encrypted = btoa(text); 
                
                const entry = {
                    id: Date.now(),
                    userId: this.currentUser.id,
                    content: encrypted, // Stored encrypted
                    date: new Date().toISOString()
                };

                DB.journals.unshift(entry);
                DB.save();
                this.renderJournalList();
                document.getElementById('new-entry').value = '';
            },

            renderJournalList() {
                const list = document.getElementById('journal-list');
                list.innerHTML = '';
                
                const userEntries = DB.journals.filter(j => j.userId === this.currentUser.id);
                
                userEntries.forEach(entry => {
                    try {
                        // Decrypt
                        const content = atob(entry.content);
                        const dateStr = new Date(entry.date).toLocaleDateString();
                        
                        const div = document.createElement('div');
                        div.className = 'journal-entry card';
                        div.innerHTML = `
                            <div class="journal-meta">
                                <span>${dateStr}</span>
                                <span class="encrypted-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Encrypted</span>
                            </div>
                            <p>${content}</p>
                        `;
                        list.appendChild(div);
                    } catch (e) {
                        console.error("Decryption failed", e);
                    }
                });
            },

            // Support Workflow
            openModal(id) {
                document.getElementById(id).classList.remove('hidden');
            },
            closeModal(id) {
                document.getElementById(id).classList.add('hidden');
            },
            
            processSupportRequest(notifySponsor) {
                this.closeModal('support-modal');
                
                // Log the alert
                DB.alerts.push({
                    userId: this.currentUser.id,
                    timestamp: new Date().toISOString(),
                    notifySponsor: notifySponsor,
                    status: 'active'
                });
                DB.save();

                // Show immediate UI feedback
                const container = document.getElementById('content-area');
                container.innerHTML = `
                    <div class="card text-center" style="border-color: var(--primary);">
                        <h2 style="color: var(--primary);">Support Activated</h2>
                        <p class="mt-4">You are not alone. Help is on the way.</p>
                        ${notifySponsor ? '<p class="badge badge-success mt-4">Your sponsor has been notified.</p>' : ''}
                        
                        <div class="mt-4 text-left">
                            <h4>Immediate Steps:</h4>
                            <ul>
                                <li>Find a safe, quiet space.</li>
                                <li>Call your sponsor.</li>
                                <li>Attend a meeting virtually or in-person.</li>
                            </ul>
                        </div>
                        <button class="btn btn-primary mt-4" onclick="app.renderView('home')">I am safe / Return</button>
                    </div>
                `;
            },

            // System Features
            quickHide() {
                // Instantly hide app
                document.getElementById('app-container').style.display = 'none';
                document.getElementById('quick-hide-btn').style.display = 'none';
                // Show fake cover
                document.getElementById('cover-page').style.display = 'block';
            },

            toggleTheme() {
                const body = document.body;
                if (this.currentTheme === 'light') {
                    this.currentTheme = 'dark';
                    body.setAttribute('data-theme', 'dark');
                } else if (this.currentTheme === 'dark') {
                    this.currentTheme = 'high-contrast';
                    body.setAttribute('data-theme', 'light'); // reset base
                    body.setAttribute('data-contrast', 'high');
                } else {
                    this.currentTheme = 'light';
                    body.removeAttribute('data-theme');
                    body.removeAttribute('data-contrast');
                }
            }
        };

        // Initialize App
        window.addEventListener('DOMContentLoaded', () => {
            app.init();
        });