document.addEventListener("DOMContentLoaded", function () {
    const cardioTypes = ["Running", "Swimming", "Cycling"];
    let workoutLog = readStorage("workoutLog")
        .filter(workout => workout && typeof workout === "object" && !Array.isArray(workout))
        .map(normalizeWorkout);
    let goals = readStorage("goals").filter(goal => goal && goal.exerciseType && goal.goalType && Number(goal.goalValue) > 0);
    let unlockedAchievements = readStorage("unlockedAchievements");
    let editingGoalIndex = -1;

    function readStorage(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function normalizeWorkout(workout) {
        return {
            ...workout,
            type: workout.type || "Workout",
            distance: Number(workout.distance) || 0,
            weight: Number(workout.weight) || 0,
            duration: Number(workout.duration) || 0,
            calories: Number(workout.calories) || 0,
            date: normalizeDate(workout.date)
        };
    }

    function normalizeDate(value) {
        if (!value) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    }

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

            if (!type || calories <= 0 || !date || duration < 0 ||
                (cardioTypes.includes(type) && distance <= 0) ||
                (type === "Strength" && weight <= 0)) {
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
            document.getElementById("date-input").value = new Date().toISOString().split("T")[0];

            // Immediately update the UI
            renderWorkoutLog();
            updateAchievements();
            updateProgress();
            renderGoalListWithEditing();
            checkProgress();
        });
    }

    const workoutTypeElement = document.getElementById("workout-type");
    if (workoutTypeElement) {
        workoutTypeElement.addEventListener("change", function () {
            let selectedType = this.value;

            // Show Distance only for Running, Swimming, and Cycling
            document.getElementById("distance-input-group").hidden = !cardioTypes.includes(selectedType);

            // Show Weight only for Strength
            document.getElementById("weight-input-group").hidden = selectedType !== "Strength";

            // Always show Duration input
            document.getElementById("duration-input-group").hidden = !selectedType;
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
            renderGoalListWithEditing();
        });
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
            renderGoalListWithEditing();
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

    // Phase 3/4 presentation helpers. These override the original renderers
    // while retaining their storage and calculation behavior.
    function renderWorkoutLog() {
        const container = document.getElementById("workout-log");
        if (!container) return;
        const query = (document.getElementById("workout-search")?.value || "").toLowerCase();
        const order = document.getElementById("workout-sort")?.value || "newest";
        const entries = workoutLog.map((workout, index) => ({ workout, index }))
            .filter(item => `${item.workout.type} ${item.workout.date}`.toLowerCase().includes(query))
            .sort((a, b) => order === "oldest"
                ? a.workout.date.localeCompare(b.workout.date)
                : b.workout.date.localeCompare(a.workout.date));

        container.innerHTML = entries.length ? entries.map(({ workout, index }) => `
            <article class="log-item">
                <div><span class="workout-type">${escapeText(workout.type)}</span><time datetime="${escapeText(workout.date)}">${escapeText(workout.date || "Undated")}</time></div>
                <div class="log-metrics"><span>${workout.distance ? `${workout.distance} km` : ""}</span><span>${workout.weight ? `${workout.weight} kg` : ""}</span><span>${workout.duration} min</span><span>${workout.calories} cal</span></div>
                <button type="button" class="btn btn-sm btn-outline-danger remove-btn" data-index="${index}">Remove</button>
            </article>`).join("") : '<div class="empty-state"><div class="empty-icon">No data</div><h3>No workouts found</h3><p>Log a workout or adjust your search to see your activity here.</p></div>';

        container.querySelectorAll(".remove-btn").forEach(button => button.addEventListener("click", function () {
            workoutLog.splice(Number(button.dataset.index), 1);
            saveWorkoutLog();
            renderWorkoutLog();
            renderGoalListWithEditing();
            updateAchievements();
        }));
        renderSummary();
    }

    function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
    }

    document.getElementById("workout-search")?.addEventListener("input", renderWorkoutLog);
    document.getElementById("workout-sort")?.addEventListener("change", renderWorkoutLog);

    function renderSummary() {
        const uniqueDates = [...new Set(workoutLog.map(workout => workout.date).filter(Boolean))].sort();
        let bestStreak = 0;
        let currentStreak = 0;
        let previousDate = null;
        uniqueDates.forEach(function (value) {
            const date = new Date(`${value}T00:00:00`);
            currentStreak = previousDate && (date - previousDate) / 86400000 === 1 ? currentStreak + 1 : 1;
            bestStreak = Math.max(bestStreak, currentStreak);
            previousDate = date;
        });
        const values = {
            "summary-workouts": workoutLog.length,
            "summary-calories": workoutLog.reduce((sum, workout) => sum + Number(workout.calories || 0), 0),
            "summary-distance": `${workoutLog.reduce((sum, workout) => sum + (cardioTypes.includes(workout.type) ? Number(workout.distance || 0) : 0), 0)} km`,
            "summary-streak": `${bestStreak} days`
        };
        Object.entries(values).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    function renderGoalListWithEditing() {
        const container = document.getElementById("goal-list");
        if (!container) return;
        container.innerHTML = goals.length ? goals.map((goal, index) => {
            const progress = getGoalProgress(goal);
            const complete = progress >= 100;
            return `<article class="goal-card ${complete ? "is-complete" : ""}">
                <div class="goal-card-heading"><div><span class="goal-label">${escapeText(goal.exerciseType)}</span><h3>${escapeText(goal.goalType)} goal ${complete ? "<span class=\"goal-complete-label\">Complete</span>" : ""}</h3></div><strong>${goal.goalValue}</strong></div>
                <div class="progress" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100"><div id="progress-${escapeText(goal.exerciseType)}-${escapeText(goal.goalType)}" class="progress-bar" style="width:${progress}%">${Math.round(progress)}%</div></div>
                <button type="button" class="btn btn-sm btn-link edit-goal" data-index="${index}">Edit</button><button type="button" class="btn btn-sm btn-link text-danger remove-goal" data-index="${index}">Remove</button>
            </article>`;
        }).join("") : '<div class="empty-state compact"><h3>No goals yet</h3><p>Choose a target to give your next workouts direction.</p></div>';

        container.querySelectorAll(".edit-goal").forEach(button => button.addEventListener("click", function () {
            openGoalEditor(Number(button.dataset.index));
        }));
        container.querySelectorAll(".remove-goal").forEach(button => button.addEventListener("click", function () {
            goals.splice(Number(button.dataset.index), 1);
            localStorage.setItem("goals", JSON.stringify(goals));
            renderGoalListWithEditing();
        }));
        updateProgress();
    }

    function goalTypeOptions(exerciseType, selected) {
        const types = cardioTypes.includes(exerciseType) ? ["Distance", "Calories"] : ["Weight", "Calories"];
        return types.map(type => `<option value="${type}" ${type === selected ? "selected" : ""}>${type === "Distance" ? "Distance (KM)" : type === "Weight" ? "Weight (KG)" : "Calories"}</option>`).join("");
    }

    function openGoalEditor(index) {
        const goal = goals[index];
        const modal = document.getElementById("editGoalModal");
        if (!goal || !modal || typeof bootstrap === "undefined") return;
        editingGoalIndex = index;
        const exercise = document.getElementById("edit-goal-exercise");
        exercise.innerHTML = ["Running", "Swimming", "Cycling", "Strength"].map(type => `<option value="${type}" ${type === goal.exerciseType ? "selected" : ""}>${type}</option>`).join("");
        document.getElementById("edit-goal-type").innerHTML = goalTypeOptions(goal.exerciseType, goal.goalType);
        document.getElementById("edit-goal-value").value = goal.goalValue;
        bootstrap.Modal.getOrCreateInstance(modal).show();
    }

    document.getElementById("edit-goal-exercise")?.addEventListener("change", function () {
        document.getElementById("edit-goal-type").innerHTML = goalTypeOptions(this.value);
    });
    document.getElementById("save-goal-edit")?.addEventListener("click", function () {
        const goal = goals[editingGoalIndex];
        const value = parseFloat(document.getElementById("edit-goal-value").value);
        if (!goal || !Number.isFinite(value) || value <= 0) { alert("Please enter a valid goal value."); return; }
        goal.exerciseType = document.getElementById("edit-goal-exercise").value;
        goal.goalType = document.getElementById("edit-goal-type").value;
        goal.goalValue = value;
        goal.completed = false;
        goal.halfwayNotified = false;
        localStorage.setItem("goals", JSON.stringify(goals));
        renderGoalListWithEditing();
        bootstrap.Modal.getInstance(document.getElementById("editGoalModal"))?.hide();
    });

    // Initiate The Page
    if (document.getElementById("goal-list")) {
        renderGoalListWithEditing();
    }
    if (document.getElementById("workout-log")) {
        renderWorkoutLog();
    }
    if (document.getElementById("achievements-list")) {
        renderAchievements();
    }
    updateAchievements();
    renderSummary();
});
