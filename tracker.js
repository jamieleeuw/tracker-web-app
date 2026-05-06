document.addEventListener("DOMContentLoaded", function () {
    let workoutLog = JSON.parse(localStorage.getItem("workoutLog")) || [];
    let goals = JSON.parse(localStorage.getItem("goals")) || [];
    let unlockedAchievements = JSON.parse(localStorage.getItem("unlockedAchievements")) || [];

    // Define achievements with progress tracking
    const achievements = {
        "first-workout": { 
            text: "🏅 First Workout - Log 1 workout", 
            goal: 1, 
            condition: () => workoutLog.length >= 1,
            progress: () => workoutLog.length
        },
        "week-streak": { 
            text: "🔥 7-Day Streak - Work out for 7 consecutive days", 
            goal: 7, 
            condition: () => hasSevenDayStreak(),
            progress: () => hasSevenDayStreak() ? 7 : workoutLog.length // Ensures only a streak unlocks it
        },
        "runner-high": { 
            text: "🏃 Runner's High - Run 5KM", 
            goal: 5, 
            condition: () => totalDistance() >= 5,
            progress: () => totalDistance()
        },
        "burn-baby-burn": { 
            text: "💪 Burn Baby Burn - Burn 500 calories", 
            goal: 500, 
            condition: () => totalCalories() >= 500,
            progress: () => totalCalories()
        }
    };

    // Workout Logging
    function saveWorkoutLog() {
        localStorage.setItem("workoutLog", JSON.stringify(workoutLog));
    }

    const logWorkoutButton = document.getElementById("log-workout");
    if (logWorkoutButton) {
        logWorkoutButton.addEventListener("click", () => {
            let type = document.getElementById("workout-type").value;
            let distance = document.getElementById("distance-input").value.trim() ? parseFloat(document.getElementById("distance-input").value) : 0;
            let weight = document.getElementById("weight-input").value.trim() ? parseFloat(document.getElementById("weight-input").value) : 0;
            let duration = document.getElementById("duration-input").value.trim() ? parseInt(document.getElementById("duration-input").value) : 0;
            let calories = parseInt(document.getElementById("calories-input").value) || 0;
            let date = document.getElementById("date-input").value;

            if (!type || type === "Select an option" || calories <= 0 || !date) {
                alert("Please enter valid workout details.");
                return;
            }

            let newWorkout = { type, distance, weight, duration, calories, date };
            workoutLog.push(newWorkout);
            
            saveWorkoutLog();

            // Clear input fields
            document.getElementById("distance-input").value = "";
            document.getElementById("weight-input").value = "";
            document.getElementById("duration-input").value = "";
            document.getElementById("calories-input").value = "";
            document.getElementById("date-input").value = "";

            // Immediately update the UI
            renderWorkoutLog();
            updateAchievements();
            updateProgress();
            updateGoalList();
            checkProgress();
        });
    }
    
    function renderWorkoutLog() {
        const logContainer = document.getElementById("workout-log");
        if (!logContainer) {
            return; // Exit if workout-log element is not found
        }
        logContainer.innerHTML = ""; // Clear existing logs
    
        workoutLog.forEach((entry, index) => {
            let logItem = document.createElement("div");
            logItem.classList.add("log-item", "card", "p-3", "mb-2");
    
            logItem.innerHTML = `
                <h5>${entry.type} - ${entry.date}</h5>
                ${["Running", "Swimming", "Cycling"].includes(entry.type) && entry.distance ? `<p><strong>Distance:</strong> ${entry.distance} KM</p>` : ""}
                ${entry.type === "Strength" && entry.weight ? `<p><strong>Weight:</strong> ${entry.weight} KG</p>` : ""}
                <p><strong>Duration:</strong> ${entry.duration} minutes</p>
                <p><strong>Calories Burned:</strong> ${entry.calories}</p>
                <button class="btn btn-danger btn-sm remove-btn" data-index="${index}">Remove</button>
            `;
            logContainer.appendChild(logItem);
        });
    
        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", function () {
                let index = parseInt(this.getAttribute("data-index"));
                workoutLog.splice(index, 1);
                saveWorkoutLog();
                renderWorkoutLog();
                updateAchievements();
                updateProgress();
                updateGoalList();
            });
        });
        updateProgress();
    }

    const workoutTypeElement = document.getElementById("workout-type");
    if (workoutTypeElement) {
        workoutTypeElement.addEventListener("change", function () {
            let selectedType = this.value;
        
            // Show Distance only for Running, Swimming, and Cycling
            document.getElementById("distance-input-group").style.display = ["Running", "Swimming", "Cycling"].includes(selectedType) ? "block" : "none";
        
            // Show Weight only for Strength
            document.getElementById("weight-input-group").style.display = selectedType === "Strength" ? "block" : "none";
        
            // Always show Duration input
            document.getElementById("duration-input-group").style.display = "block";
        });
    }

    // Goal Tracking 
    function updateProgress() {
        let completedGoals = [];

        goals.forEach(goal => {
            let progress = getGoalProgress(goal);
    
            let progressBar = document.querySelector(`#progress-${goal.exerciseType}-${goal.goalType}`);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.innerText = `${Math.round(progress)}%`;
            }

            if (progress >= 100 && !goal.completed) {
                goal.completed = true;
                completedGoals.push(goal);
            }
        });

        if (completedGoals.length > 0) {
            completedGoals.forEach(goal => {
                showGoalCompletionMessage(goal);
            });
        }
        localStorage.setItem("goals", JSON.stringify(goals));
    }

    function showGoalCompletionMessage(goal) {
        let message = `🎉 Goal Completed: ${goal.exerciseType} - ${goal.goalType} (${goal.goalValue})`;
    
        let popup = document.createElement("div");
        popup.className = "goal-completion-popup";
        popup.innerHTML = message;
        document.body.appendChild(popup);
    
        // Center the popup at the top
        popup.style.position = "fixed";
        popup.style.top = "20px";
        popup.style.left = "50%";
        popup.style.transform = "translateX(-50%)";
        popup.style.backgroundColor = "#28a745";
        popup.style.color = "white";
        popup.style.padding = "15px";
        popup.style.borderRadius = "10px";
        popup.style.zIndex = "1050";  // Ensure it's on top
    
        setTimeout(() => {
            popup.classList.add("show");
        }, 100);
    
        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => {
                popup.remove();
            }, 500);
        }, 2000);
    }

    const addGoalButton = document.getElementById("add-goal");
    if (addGoalButton) {
        addGoalButton.addEventListener("click", function () {
            let exerciseType = document.getElementById("goal-exercise").value;
            let goalType = document.getElementById("goal-type").value;
            let goalValue = parseFloat(document.getElementById("goal-value").value);

            if (isNaN(goalValue) || goalValue <= 0) {
                alert("Please enter a valid goal value.");
                return;
            }

            let newGoal = {exerciseType, goalType, goalValue};
            goals.push(newGoal);
            localStorage.setItem("goals", JSON.stringify(goals))
            updateGoalList();
        });
    }

    function updateGoalList() {
        const goalListContainer = document.getElementById("goal-list");
        if (!goalListContainer) {
            return; // Exit if goal-list element is not found
        }
        goalListContainer.innerHTML = "";

        goals.forEach((goal, index) => {
            let goalItem = document.createElement("div");
            goalItem.classList.add("card", "p-2", "mb-2");

            let progress = getGoalProgress(goal);

            goalItem.innerHTML = `
            <p><strong>${goal.exerciseType} - ${goal.goalType} Goal:</strong> ${goal.goalValue}</p>
            <div class="progress">
                <div class="progress-bar ${progress >= 100 ? 'bg-success' : 'bg-primary'}" role="progressbar"
                    style="width: ${progress}%"
                    aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                    ${Math.round(progress)}%
                </div>
            </div>
            <button class="btn-danger btn-sm mt-2 remove-goal" data-index="${index}">Remove</button>        
            `;

            goalListContainer.appendChild(goalItem);
        });

        //Remove goal
        document.querySelectorAll(".remove-goal").forEach(button => {
            button.addEventListener("click", function () {
                let index = parseInt(this.getAttribute("data-index"));
                goals.splice(index, 1);
                localStorage.setItem("goals", JSON.stringify(goals));
                updateGoalList();
            });
        });

        localStorage.setItem("goals", JSON.stringify(goals));
    }

    const goalExerciseElement = document.getElementById("goal-exercise");
    if (goalExerciseElement) {
        goalExerciseElement.addEventListener("change", function(){
            let selectedExercise = this.value;
            let goalTypeSelect = document.getElementById("goal-type");

            goalTypeSelect.innerHTML = "";

            if (["Running", "Swimming", "Cycling"].includes(selectedExercise)) {
                goalTypeSelect.innerHTML += `
                    <option value="Distance">Distance (KM)</option>
                    <option value="Calories">Calories</option>
                `;
            }
            else if (selectedExercise === "Strength"){
                goalTypeSelect.innerHTML += `
                    <option value="Weight">Weight (KG)</option>
                    <option value="Calories">Calories</option>
                `;
            }
        });
    }

    function getGoalProgress(goal) {
        let progress = 0;

        let relevantWorkouts = workoutLog.filter(w => w.type === goal.exerciseType);

        if (goal.goalType === "Distance") {
            let totalDistance = relevantWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
            progress = Math.min((totalDistance / goal.goalValue) * 100, 100);
        } else if (goal.goalType === "Weight") {
            let totalWeight = relevantWorkouts.reduce((sum,w) => sum + (w.weight || 0),0);
            progress = Math.min((totalWeight / goal.goalValue) * 100, 100);
        } else if (goal.goalType === "Calories") {
            let totalCalories = relevantWorkouts.reduce((sum,w) => sum + (w.calories || 0),0);
            progress = Math.min((totalCalories / goal.goalValue) * 100, 100);
        }
        return progress;
    }

    // Resetting all Goals and Workout logs
    const resetProgressButton = document.getElementById("confirm-reset-progress");
    if (resetProgressButton) {
        resetProgressButton.addEventListener("click", () => {
            // Clear all stored data
            localStorage.removeItem("workoutLog");  // Remove all workouts
            localStorage.removeItem("goals");// Remove all goals
            localStorage.removeItem("unlockedAchievements"); // Remove all unlocked achievements

            // Clear local arrays
            workoutLog = [];
            goals = [];
            unlockedAchievement = [];

            saveWorkoutLog();

            // Update UI
            renderWorkoutLog();
            updateGoalList();
            renderAchievements();

            // Get the modal element
            let resetModalElement = document.getElementById("resetModal");

            // Ensure the Bootstrap modal instance exists, then hide it
            let resetModal = bootstrap.Modal.getInstance(resetModalElement);
            if (!resetModal) {
                resetModal = new bootstrap.Modal(resetModalElement);
            }

            resetModal.hide(); // Close the modal properly

            // Delay to ensure modal is fully closed before refreshing
            setTimeout(() => {
                location.reload();  // Refresh to clear the UI
            }, 500);
        });
    }

    function updateAchievements() {
        Object.keys(achievements).forEach((key) => {
            if (achievements[key].condition() && !unlockedAchievements.includes(key)) {
                unlockAchievement(key);
            }
        });
    
        localStorage.setItem("unlockedAchievements", JSON.stringify(unlockedAchievements));
        renderAchievements();  // Ensure UI updates
    }

    function totalDistance() {
        return workoutLog
            .filter(w => ["Running", "Swimming", "Cycling"].includes(w.type))
            .reduce((sum, w) => sum + (w.distance || 0), 0);
    }

    function totalCalories() {
        return workoutLog.reduce((sum, w) => sum + (w.calories || 0), 0);
    }

    function hasSevenDayStreak() {
        if (workoutLog.length < 7) return false; // Not enough workouts logged
    
        // Get unique workout dates
        let uniqueDates = [...new Set(workoutLog.map(w => w.date))].sort();
    
        // Ensure the last 7 dates are consecutive
        for (let i = 0; i < uniqueDates.length - 6; i++) {
            let streak = true;
            for (let j = 0; j < 7; j++) {
                let expectedDate = new Date(uniqueDates[i]);
                expectedDate.setDate(expectedDate.getDate() + j);
                if (uniqueDates[i + j] !== expectedDate.toISOString().split("T")[0]) {
                    streak = false;
                    break;
                }
            }
            if (streak) return true; // Found a valid 7-day streak
        }
    
        return false; // No streak found
    }

    let achievementQueue = [];
    let popupActive = false;

    function showNextAchievement() {
        if (achievementQueue.length === 0) {
            popupActive = false;
            return;
        }
    
        popupActive = true;
        let message = achievementQueue.shift();
        
        let popup = document.createElement("div");
        popup.className = "achievement-popup";
        popup.innerHTML = `🎉 ${message}`;
        document.body.appendChild(popup);
        
        // Center the popup at the top
        popup.style.position = "fixed";
        popup.style.top = "20px";
        popup.style.left = "50%";
        popup.style.transform = "translateX(-50%)";
        popup.style.backgroundColor = "#28a745";
        popup.style.color = "white";
        popup.style.padding = "15px";
        popup.style.borderRadius = "10px";
        popup.style.zIndex = "1050";  // Ensure it's on top
    
        setTimeout(() => {
            popup.classList.add("show");
        }, 100);
    
        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => {
                popup.remove();
                showNextAchievement(); // Show next popup after previous one disappears
            }, 500);
        }, 2000);
    }

    function unlockAchievement(key) {
        if (!unlockedAchievements.includes(key)) {
            unlockedAchievements.push(key);
            localStorage.setItem("unlockedAchievements", JSON.stringify(unlockedAchievements));

            // Add achievement to queue
            achievementQueue.push(achievements[key].text);
            if (!popupActive) {
                showNextAchievement();
            }
        }
    }

    function renderAchievements() {
        const achievementsContainer = document.getElementById("achievements-list");
        if (!achievementsContainer) {
            return; // Exit if achievements-list element is not found
        }
    
        console.log("Rendering achievements...");
        console.log("Achievements data:", achievements);
        console.log("Unlocked Achievements:", unlockedAchievements);
        
        
        achievementsContainer.innerHTML = "";
    
        Object.keys(achievements).forEach((key) => {
            let isUnlocked = unlockedAchievements.includes(key);
            let progress = Math.min((achievements[key].progress() / achievements[key].goal) * 100, 100);
            
            console.log(`Achievement: ${key} - Unlocked: ${isUnlocked} - Progress: ${progress}%`);
              
            let achievementItem = document.createElement("div");
            achievementItem.classList.add("achievement-item", "card", "p-3", "mb-2");
    
            achievementItem.innerHTML = `
                <h5>${achievements[key].text}</h5>
                <p>Status: <span class="${isUnlocked ? 'text-success' : 'text-muted'}">
                    ${isUnlocked ? "Unlocked ✅" : "In Progress 🔄"}
                </span></p>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${isUnlocked ? 'bg-success' : 'bg-primary'}" role="progressbar"
                        style="width: ${progress}%;" 
                        aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                        ${Math.round(progress)}%
                    </div>
                </div>
                <p><strong>Progress:</strong> ${achievements[key].progress()}/${achievements[key].goal}</p>
            `;
    
            achievementsContainer.appendChild(achievementItem);
        });
    }

    // Check progress and show motivational popup if halfway
    function checkProgress() {
        goals.forEach(goal => {
            let progress = getGoalProgress(goal);
            if (progress >= 50 && progress < 100 && !goal.halfwayNotified) {
                showMotivationalPopup();
                goal.halfwayNotified = true;
                localStorage.setItem("goals", JSON.stringify(goals));
            }
        });
    }

    function showMotivationalPopup() {
        let motivationalModal = new bootstrap.Modal(document.getElementById('motivationalModal'));
        motivationalModal.show();
    }

    // Initiate The Page
    if (document.getElementById("goal-list")) {
        updateGoalList();
    }

    // Initiate The Page
    if (document.getElementById("goal-list")) {
        updateGoalList();
    }
    if (document.getElementById("workout-log")) {
        renderWorkoutLog();
    }
    if (document.getElementById("achievements-list")) {
        renderAchievements();
    }
    updateAchievements();
});
