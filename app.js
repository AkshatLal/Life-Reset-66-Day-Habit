import { auth, db, provider, signInWithRedirect, onAuthStateChanged, signOut, doc, setDoc, getDoc, getRedirectResult } from './firebase-config.js';

const ui = {
    currentUser: null,
    userData: { xp: 0, level: 1, streak: 0, plan: [] },
    
    // RESTORED: The parameters array and selection state
    parameters: [
        { id: 'mental', label: 'Mental Health', task: 'Complete 10 min Guided Meditation' },
        { id: 'screen', label: 'Screen Time', task: 'Activate Screen Blocker for 2 hours' },
        { id: 'time', label: 'Procrastination', task: 'Complete one 25-min Focus Timer' },
        { id: 'physical', label: 'Physical Health', task: 'Log workout or 10,000 steps' },
        { id: 'sleep', label: 'Sleep Quality', task: 'Wind-down routine by 10:00 PM' },
        { id: 'water', label: 'Hydration', task: 'Drink 2 Liters of Water' }
    ],
    selectedParams: new Set(),

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        event.target.classList.add('active');
    },

    // RESTORED: Generating the Quiz Grid
    renderGrid() {
        const grid = document.getElementById('param-grid');
        grid.innerHTML = '';
        this.parameters.forEach(param => {
            const div = document.createElement('div');
            div.className = 'param-card';
            div.textContent = param.label;
            div.onclick = () => {
                div.classList.toggle('selected');
                this.selectedParams.has(param.id) ? this.selectedParams.delete(param.id) : this.selectedParams.add(param.id);
            };
            grid.appendChild(div);
        });
    },

    // RESTORED: Saving the new plan to the database
    async savePlanAndLoadDashboard() {
        if (this.selectedParams.size === 0) return alert("Select at least one area!");
        
        this.switchScreen('screen-loading');
        const userPlan = Array.from(this.selectedParams);
        
        await setDoc(doc(db, "users", this.currentUser.uid), {
            plan: userPlan,
            day: 1,
            email: this.currentUser.email,
            xp: 0,
            level: 1,
            streak: 0
        }, { merge: true });

        setTimeout(() => this.loadDashboard({ plan: userPlan, xp: 0, level: 1, streak: 0 }), 1500);
    },

    async loadDashboard(userData) {
        this.userData = { ...this.userData, ...userData }; 
        document.getElementById('user-greeting').textContent = `Welcome back, ${this.currentUser.displayName || 'Player'}`;
        
        this.updateRPGStats();
        
        const list = document.getElementById('quest-list');
        list.innerHTML = ''; 

        // Load Quests
        this.addQuestToList(list, "Make your bed", 10);
        this.parameters.forEach(param => {
            if (this.userData.plan.includes(param.id)) this.addQuestToList(list, param.task, 15);
        });

        this.switchScreen('screen-dashboard');
    },

    // --- THE RPG ENGINE ---
    async gainXP(amount) {
        this.userData.xp += amount;
        
        const xpRequired = this.userData.level * 100;
        if (this.userData.xp >= xpRequired) {
            this.userData.level++;
            this.userData.xp -= xpRequired;
            alert(`🎉 LEVEL UP! You are now Level ${this.userData.level}!`);
        }

        this.updateRPGStats();

        await setDoc(doc(db, "users", this.currentUser.uid), {
            xp: this.userData.xp,
            level: this.userData.level
        }, { merge: true });
    },

    updateRPGStats() {
        const xpRequired = this.userData.level * 100;
        const xpPercentage = (this.userData.xp / xpRequired) * 100;
        
        document.getElementById('ui-level').textContent = `Lvl ${this.userData.level} Player`;
        document.getElementById('ui-xp-text').textContent = this.userData.xp;
        document.getElementById('ui-xp-bar').style.width = `${xpPercentage}%`;
        document.getElementById('ui-streak').textContent = this.userData.streak;
    },

    addQuestToList(listElement, taskName, xpReward) {
        const div = document.createElement('div');
        div.className = 'quest-item';
        
        const span = document.createElement('span');
        span.textContent = taskName;
        
        const btn = document.createElement('button');
        btn.className = 'quest-btn';
        btn.textContent = `+ ${xpReward} XP`;
        
        btn.onclick = () => {
            btn.classList.add('completed');
            btn.textContent = 'Completed';
            btn.disabled = true;
            this.gainXP(xpReward); 
        };

        div.appendChild(span); div.appendChild(btn); listElement.appendChild(div);
    },

    // --- MINI TOOL: FOCUS TIMER ---
    timerInterval: null,
    startTimer() {
        let timeLeft = 25 * 60; 
        const display = document.getElementById('timer-display');
        const btn = document.getElementById('btn-start-timer');
        
        btn.disabled = true;
        btn.textContent = "Focusing...";

        this.timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                display.textContent = "25:00";
                btn.disabled = false;
                btn.textContent = "Start Focus";
                this.gainXP(50); 
                alert("Session Complete! +50 XP");
            }
        }, 1000);
    }
};

document.getElementById('btn-start-timer').addEventListener('click', () => ui.startTimer());

document.getElementById('btn-login').addEventListener('click', () => {
    signInWithRedirect(auth, provider).catch(error => console.error("Login failed", error));
});

document.getElementById('btn-generate').addEventListener('click', () => {
    ui.savePlanAndLoadDashboard();
});

document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
});

// --- NEW CATCHER: Forces Firebase to process the redirect ---
getRedirectResult(auth).then((result) => {
    if (result) {
        console.log("🎯 Redirect caught successfully! User:", result.user.email);
    }
}).catch((error) => {
    console.error("❌ Redirect completely failed:", error.message);
    alert("Login failed due to browser cookies. See console.");
});

// Firebase Auth Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User authenticated successfully:", user.email);
        ui.currentUser = user;
        
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            
            if (docSnap.exists() && docSnap.data().plan) {
                console.log("📂 Existing plan found. Loading dashboard.");
                ui.loadDashboard(docSnap.data()); 
            } else {
                console.log("🆕 New user or no plan found. Loading quiz.");
                ui.renderGrid();
                ui.switchScreen('screen-quiz'); 
            }
        } catch (error) {
            console.error("❌ Database Error:", error.message);
            // Even if DB fails, render the grid so it doesn't freeze
            ui.renderGrid();
            ui.switchScreen('screen-quiz'); 
        }
    } else {
        console.log("🔒 No user logged in.");
        ui.switchScreen('screen-login'); 
    }
});
