import { auth, db, provider, signInWithPopup, onAuthStateChanged, signOut, doc, setDoc, getDoc } from './firebase-config.js';

const ui = {
    currentUser: null,
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

    async savePlanAndLoadDashboard() {
        if (this.selectedParams.size === 0) return alert("Select at least one area!");
        
        this.switchScreen('screen-loading');
        
        const userPlan = Array.from(this.selectedParams);
        
        // Save to Firebase Firestore Database
        await setDoc(doc(db, "users", this.currentUser.uid), {
            plan: userPlan,
            day: 1,
            email: this.currentUser.email
        }, { merge: true });

        setTimeout(() => this.loadDashboard(userPlan), 1500); // Artificial delay for effect
    },

    loadDashboard(userPlan) {
        document.getElementById('user-greeting').textContent = `Welcome, ${this.currentUser.displayName}`;
        const list = document.getElementById('quest-list');
        list.innerHTML = ''; 

        // Always add foundational habit
        this.addQuestToList(list, "Make your bed");

        // Add targeted quests based on saved DB array
        this.parameters.forEach(param => {
            if (userPlan.includes(param.id)) this.addQuestToList(list, param.task);
        });

        this.switchScreen('screen-dashboard');
    },

    addQuestToList(listElement, taskName) {
        const div = document.createElement('div');
        div.className = 'quest-item';
        
        const span = document.createElement('span');
        span.textContent = taskName;
        
        const btn = document.createElement('button');
        btn.className = 'quest-btn';
        btn.textContent = '+ 10 XP';
        btn.onclick = () => {
            btn.classList.add('completed');
            btn.textContent = 'Completed';
            btn.disabled = true;
        };

        div.appendChild(span); div.appendChild(btn); listElement.appendChild(div);
    }
};

// --- EVENT LISTENERS & AUTH STATE ---

document.getElementById('btn-login').addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("Login failed", error));
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
        ui.currentUser = user;
        
        // Check database to see if they already created a plan
        const docSnap = await getDoc(doc(db, "users", user.uid));
        
        if (docSnap.exists() && docSnap.data().plan) {
            ui.loadDashboard(docSnap.data().plan); // Skip quiz, go to dashboard
        } else {
            ui.renderGrid();
            ui.switchScreen('screen-quiz'); // New user, show quiz
        }
    } else {
        ui.switchScreen('screen-login'); // Logged out
    }
});
