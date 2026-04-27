import { auth, db, provider, signInWithRedirect, onAuthStateChanged, signOut, doc, setDoc, getDoc } from './firebase-config.js';

const ui = {
    currentUser: null,
    userData: { xp: 0, level: 1, streak: 0, plan: [] },
    
    // ... (Keep your parameters array here) ...

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        // Update active class on sidebar
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        event.target.classList.add('active');
    },

    async loadDashboard(userData) {
        this.userData = { ...this.userData, ...userData }; // Merge database data
        document.getElementById('user-greeting').textContent = `Welcome back, ${this.currentUser.displayName}`;
        
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
        
        // Level up calculation (Every 100 XP = 1 Level)
        const xpRequired = this.userData.level * 100;
        if (this.userData.xp >= xpRequired) {
            this.userData.level++;
            this.userData.xp -= xpRequired;
            alert(`🎉 LEVEL UP! You are now Level ${this.userData.level}!`);
        }

        this.updateRPGStats();

        // Save new stats to Firebase
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
            this.gainXP(xpReward); // Trigger the RPG Engine!
        };

        div.appendChild(span); div.appendChild(btn); listElement.appendChild(div);
    },

    // --- MINI TOOL: FOCUS TIMER ---
    timerInterval: null,
    startTimer() {
        let timeLeft = 25 * 60; // 25 minutes
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
                this.gainXP(50); // Reward for deep work
                alert("Session Complete! +50 XP");
            }
        }, 1000);
    }
};

// Add listener for the timer
document.getElementById('btn-start-timer').addEventListener('click', () => ui.startTimer());

// --- EVENT LISTENERS & AUTH STATE ---

document.getElementById('btn-login').addEventListener('click', () => {
    signInWithRedirect(auth, provider).catch(error => console.error("Login failed", error));
});

document.getElementById('btn-generate').addEventListener('click', () => {
    ui.savePlanAndLoadDashboard();
});

document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
});

// Firebase Auth Observer - The magic that checks if someone is logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User authenticated successfully:", user.email);
        ui.currentUser = user;
        
        try {
            console.log("🔍 Checking database for existing plan...");
            // Check database to see if they already created a plan
            const docSnap = await getDoc(doc(db, "users", user.uid));
            
            if (docSnap.exists() && docSnap.data().plan) {
                console.log("📂 Existing plan found. Loading dashboard.");
                ui.loadDashboard(docSnap.data().plan); // Skip quiz, go to dashboard
            } else {
                console.log("🆕 New user or no plan found. Loading quiz.");
                ui.renderGrid();
                ui.switchScreen('screen-quiz'); // New user, show quiz
            }
        } catch (error) {
            // If the database fails (e.g., security rules), log the error but STILL let the user in!
            console.error("❌ Database Error:", error.message);
            ui.renderGrid();
            ui.switchScreen('screen-quiz'); 
        }
        
    } else {
        console.log("🔒 No user logged in. Showing login screen.");
        ui.switchScreen('screen-login'); // Logged out
    }
});
