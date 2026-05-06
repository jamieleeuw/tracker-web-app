document.addEventListener("DOMContentLoaded", function () {

    // Display user name and surname
    const userName = localStorage.getItem("userName");
    const userSurname = localStorage.getItem("userSurname");
    document.getElementById("user-name").innerText = `Hello, ${userName} ${userSurname}`;

    // Display the most recent goal
    const goals = JSON.parse(localStorage.getItem("goals")) || [];
    if (goals.length > 0) {
        const recentGoal = goals[goals.length - 1];
        document.getElementById("recent-goal").innerText = `Recent Goal: ${recentGoal.exerciseType} - ${recentGoal.goalType} (${recentGoal.goalValue})`;
        updateGoalProgress(recentGoal);
    }

    // Generate charts
    const workoutLog = JSON.parse(localStorage.getItem("workoutLog")) || [];
    const workoutCounts = workoutLog.reduce((counts, workout) => {
        counts[workout.type] = (counts[workout.type] || 0) + 1;
        return counts;
    }, {});

    const workoutCountsChartCtx = document.getElementById("workout-counts-chart").getContext("2d");
    new Chart(workoutCountsChartCtx, {
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
    const caloriesBurnedChart = new Chart(caloriesCtx, {
        type: 'doughnut',
        data: {
            labels: [], // Empty labels initially
            datasets: [{
                label: 'Calories Burned',
                data: [], // Empty data initially
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
    const averageWorkoutDurationChart = new Chart(durationCtx, {
        type: 'bar',
        data: {
            labels: [], // Empty labels initially
            datasets: [{
                label: 'Average Workout Duration (minutes)',
                data: [], // Empty data initially
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
  
    // Load existing workout data into the charts
    workoutLog.forEach(workout => {
        updateCalorieChart(workout.date, workout.calories);
        updateAverageWorkoutDurationChart(workout.date, workout.duration);
    });

    // Function to update the calorie chart
    function updateCalorieChart(date, calories) {
        const index = caloriesBurnedChart.data.labels.indexOf(date);
        if (index === -1) {
            // If the date is not in the labels, add it
            caloriesBurnedChart.data.labels.push(date);
            caloriesBurnedChart.data.datasets[0].data.push(calories);
        } else {
            // If the date is already in the labels, update the calories
            caloriesBurnedChart.data.datasets[0].data[index] = calories;
        }
        caloriesBurnedChart.update();
    }

    // Function to update the average workout duration chart
    function updateAverageWorkoutDurationChart(date, duration) {
        const index = averageWorkoutDurationChart.data.labels.indexOf(date);
        if (index === -1) {
            // If the date is not in the labels, add it
            averageWorkoutDurationChart.data.labels.push(date);
            averageWorkoutDurationChart.data.datasets[0].data.push(duration);
        } else {
            // If the date is already in the labels, update the duration
            averageWorkoutDurationChart.data.datasets[0].data[index] = duration;
        }
        averageWorkoutDurationChart.update();
    }

    // Function to update the goal progress
    function updateGoalProgress(goal) {
        const progressElement = document.getElementById('goal-progress');
        const currentValue = goal.currentValue || 0; // Ensure currentValue is defined
        const progress = Math.min((currentValue / goal.goalValue) * 100, 100);
        progressElement.style.setProperty('--progress', `${progress}%`);
        progressElement.setAttribute('data-progress', Math.round(progress));
    }

    // Handle form submission for logging workouts
    document.getElementById('logWorkoutForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const workoutType = document.getElementById('workoutType').value;
        const workoutCalories = parseInt(document.getElementById('workoutCalories').value);
        const workoutDuration = parseInt(document.getElementById('workoutDuration').value);
        const workoutDate = new Date().toLocaleDateString(); // Use current date for simplicity

        // Add the new workout to the workout log
        const newWorkout = { type: workoutType, calories: workoutCalories, duration: workoutDuration, date: workoutDate };
        workoutLog.push(newWorkout);
        localStorage.setItem('workoutLog', JSON.stringify(workoutLog));

        // Update the calorie chart with the new data
        updateCalorieChart(workoutDate, workoutCalories);

        // Update the average workout duration chart with the new data
        updateAverageWorkoutDurationChart(workoutDate, workoutDuration);

        // Add event to the calendar
        calendar.addEvent({
            title: `${workoutType} - ${workoutCalories} cal`,
            start: workoutDate
        });

        // Reset the form
        document.getElementById('logWorkoutForm').reset();
        // Close the modal
        const logWorkoutModal = new bootstrap.Modal(document.getElementById('logWorkoutModal'));
        logWorkoutModal.hide();
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
