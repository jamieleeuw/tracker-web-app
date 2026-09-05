document.addEventListener("DOMContentLoaded", function () {

    // Display user name and surname
    const userName = localStorage.getItem("userName");
    const userSurname = localStorage.getItem("userSurname");
    document.getElementById("user-name").innerText = `Hello, ${userName || "there"} ${userSurname || ""}`.trim();

    // Display the most recent goal
    const goals = JSON.parse(localStorage.getItem("goals")) || [];
    if (goals.length > 0) {
        const recentGoal = goals[goals.length - 1];
        document.getElementById("recent-goal").innerText = `Recent Goal: ${recentGoal.exerciseType} - ${recentGoal.goalType} (${recentGoal.goalValue})`;
        const relevant = (JSON.parse(localStorage.getItem("workoutLog")) || []).filter(workout => workout.type === recentGoal.exerciseType);
        const current = relevant.reduce((sum, workout) => sum + (recentGoal.goalType === "Distance" ? Number(workout.distance) || 0 : recentGoal.goalType === "Weight" ? Number(workout.weight) || 0 : Number(workout.calories) || 0), 0);
        updateGoalProgress(recentGoal, current);
    }

    // Generate charts
    const workoutLog = JSON.parse(localStorage.getItem("workoutLog")) || [];
    const workoutCounts = workoutLog.reduce((counts, workout) => {
        counts[workout.type] = (counts[workout.type] || 0) + 1;
        return counts;
    }, {});

    const workoutCountsChartCtx = document.getElementById("workout-counts-chart").getContext("2d");
    const workoutCountsChart = new Chart(workoutCountsChartCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(workoutCounts),
            datasets: [{
                label: 'Workout Counts',
                data: Object.values(workoutCounts),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const caloriesCtx = document.getElementById('calories-burned-chart').getContext('2d');
    const caloriesByType = workoutLog.reduce((totals, workout) => { totals[workout.type] = (totals[workout.type] || 0) + (Number(workout.calories) || 0); return totals; }, {});
    const caloriesBurnedChart = new Chart(caloriesCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(caloriesByType),
            datasets: [{
                label: 'Calories Burned',
                data: Object.values(caloriesByType),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    const durationCtx = document.getElementById('average-workout-duration-chart').getContext('2d');
    const durationByType = workoutLog.reduce((totals, workout) => { const type = workout.type || "Workout"; totals[type] ||= []; totals[type].push(Number(workout.duration) || 0); return totals; }, {});
    const averageWorkoutDurationChart = new Chart(durationCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(durationByType),
            datasets: [{
                label: 'Average Workout Duration (minutes)',
                data: Object.values(durationByType).map(values => values.reduce((sum, value) => sum + value, 0) / values.length),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const calendarElement = document.getElementById("workout-calendar");
    const calendar = calendarElement && typeof FullCalendar !== "undefined"
        ? new FullCalendar.Calendar(calendarElement, {
            initialView: "dayGridMonth",
            height: "auto",
            events: workoutLog.map(workout => ({
                title: `${workout.type} - ${workout.calories || 0} cal`,
                start: normalizeDate(workout.date)
            })).filter(event => event.start)
        })
        : null;

    if (calendar) {
        calendar.render();
    }

    const homeWorkoutType = document.getElementById("home-workout-type");
    const homeDistanceGroup = document.getElementById("home-distance-group");
    const homeWeightGroup = document.getElementById("home-weight-group");
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("workoutDate").value = today;

    homeWorkoutType.addEventListener("change", function () {
        const cardio = ["Running", "Swimming", "Cycling"].includes(this.value);
        homeDistanceGroup.hidden = !cardio;
        homeWeightGroup.hidden = this.value !== "Strength";
    });
  
    // Load existing workout data into the charts
    // Charts are aggregated by workout type so repeated sessions remain accurate.

    // Function to update the calorie chart
    function updateCalorieChart(type, calories) {
        const index = caloriesBurnedChart.data.labels.indexOf(type);
        if (index === -1) {
            caloriesBurnedChart.data.labels.push(type);
            caloriesBurnedChart.data.datasets[0].data.push(calories);
        } else {
            caloriesBurnedChart.data.datasets[0].data[index] += Number(calories) || 0;
        }
        caloriesBurnedChart.update();
    }

    // Function to update the average workout duration chart
    function updateAverageWorkoutDurationChart(type, duration) {
        const index = averageWorkoutDurationChart.data.labels.indexOf(type);
        if (index === -1) {
            averageWorkoutDurationChart.data.labels.push(type);
            averageWorkoutDurationChart.data.datasets[0].data.push(duration);
        } else {
            const durations = workoutLog.filter(workout => workout.type === type).map(workout => Number(workout.duration) || 0);
            averageWorkoutDurationChart.data.datasets[0].data[index] = durations.reduce((sum, value) => sum + value, 0) / durations.length;
        }
        averageWorkoutDurationChart.update();
    }

    function normalizeDate(date) {
        if (!date) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const parsed = new Date(date);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
    }

    function updateWorkoutCountsChart(type) {
        const index = workoutCountsChart.data.labels.indexOf(type);
        if (index === -1) {
            workoutCountsChart.data.labels.push(type);
            workoutCountsChart.data.datasets[0].data.push(1);
        } else {
            workoutCountsChart.data.datasets[0].data[index] += 1;
        }
        workoutCountsChart.update();
    }

    // Function to update the goal progress
    function updateGoalProgress(goal, currentValue = 0) {
        const progressElement = document.getElementById('goal-progress');
        const progress = Math.min((currentValue / Number(goal.goalValue)) * 100, 100);
        progressElement.style.setProperty('--progress', `${progress}%`);
        progressElement.setAttribute('data-progress', Math.round(progress));
    }

    // Handle form submission for logging workouts
    document.getElementById('logWorkoutForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const workoutType = homeWorkoutType.value;
        const workoutDistance = parseFloat(document.getElementById("home-distance").value) || 0;
        const workoutWeight = parseFloat(document.getElementById("home-weight").value) || 0;
        const workoutCalories = parseInt(document.getElementById('workoutCalories').value, 10);
        const workoutDuration = parseInt(document.getElementById('workoutDuration').value, 10) || 0;
        const workoutDate = document.getElementById("workoutDate").value;

        if (!workoutType || !workoutDate || !Number.isFinite(workoutCalories) || workoutCalories <= 0) {
            showPopup("Please enter a workout type, date and calories burned.");
            return;
        }

        // Add the new workout to the workout log
        const newWorkout = { type: workoutType, distance: workoutDistance, weight: workoutWeight, calories: workoutCalories, duration: workoutDuration, date: workoutDate };
        workoutLog.push(newWorkout);
        localStorage.setItem('workoutLog', JSON.stringify(workoutLog));

        updateCalorieChart(workoutType, workoutCalories);
        updateWorkoutCountsChart(workoutType);
        updateAverageWorkoutDurationChart(workoutType, workoutDuration);

        // Add event to the calendar
        if (calendar) {
            calendar.addEvent({
                title: `${workoutType} - ${workoutCalories} cal`,
                start: workoutDate
            });
        }

        // Reset the form
        document.getElementById('logWorkoutForm').reset();
        document.getElementById("workoutDate").value = today;
        homeDistanceGroup.hidden = true;
        homeWeightGroup.hidden = true;
        // Close the modal
        bootstrap.Modal.getInstance(document.getElementById('logWorkoutModal'))?.hide();
        showPopup(`Workout logged: ${workoutType} - ${workoutCalories} cal on ${workoutDate}`);
    });


    function showPopup(message) {
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.innerText = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('show');
        }, 100);

        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(popup);
            }, 300);
        }, 2000);
    }
});
