document.addEventListener("DOMContentLoaded", function () {
    const workouts = [
        { name: "Push ups", video: "https://www.youtube.com/embed/IODxDxX7oi4", img: "Images/push-ups.jpg"},
        { name: "Squats", video: "https://www.youtube.com/embed/aclHkVaku9U", img: "Images/squats.jpg"},
        { name: "Deadlifts", video: "https://www.youtube.com/embed/op9kVnSso6Q", img: "Images/deadlift.jpg"},
        { name: "Bench Press", video: "https://www.youtube.com/embed/rT7DgCr-3pg", img: "Images/bench-press.webp"},
        { name: "Planks", video: "https://www.youtube.com/embed/pSHjTRCQxIw", img: "Images/plank.jpg" },
        { name: "Dumbbell Curls", video:"https://www.youtube.com/embed/ykJmrZ5v0Oo", img:"Images/dumbbell-curls.jpg"}
    ];

    const workoutGrid = document.getElementById("workout-grid");
    const videoModal = new bootstrap.Modal(document.getElementById("videoModal"));
    const videoTitle = document.getElementById("videoTitle");
    const workoutVideo = document.getElementById("workoutVideo");

    let favoriteWorkouts = JSON.parse(localStorage.getItem("favoriteWorkouts")) || [];

    function updateWorkoutGrid() {
        workoutGrid.innerHTML = "";

        let sortedWorkouts = [...workouts].sort((a, b) => {
            let aFav = favoriteWorkouts.includes(a.name);
            let bFav = favoriteWorkouts.includes(b.name);
            return bFav - aFav; // Move favorites to the top
        });

        sortedWorkouts.forEach((workout) => {
            let isFavorite = favoriteWorkouts.includes(workout.name);
            let col = document.createElement("div");
            col.classList.add("col-md-4", "mb-4");

            col.innerHTML = `
                <div class="card workout-card">
                    <img src="${workout.img}" class="card-img-top" alt="${workout.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title">${workout.name}</h5>
                        <button class="btn btn-primary view-video" data-video="${workout.video}" data-name="${workout.name}">▶️ Watch</button>
                        <button class="btn btn-sm favorite-btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}" data-name="${workout.name}">
                            ${isFavorite ? "❤️" : "🤍"}
                        </button>
                    </div>
                </div>
            `;
            workoutGrid.appendChild(col);
        });

        attachEventListeners();
    }

    function attachEventListeners() {
        document.querySelectorAll(".view-video").forEach((btn) => {
            btn.addEventListener("click", function () {
                let videoUrl = this.getAttribute("data-video");
                let workoutName = this.getAttribute("data-name");
                workoutVideo.src = videoUrl;
                videoTitle.textContent = workoutName;
                videoModal.show();
            });
        });

        document.querySelectorAll(".favorite-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                let workoutName = this.getAttribute("data-name");
                if (favoriteWorkouts.includes(workoutName)) {
                    favoriteWorkouts = favoriteWorkouts.filter((w) => w !== workoutName);
                } else {
                    favoriteWorkouts.push(workoutName);
                }
                localStorage.setItem("favoriteWorkouts", JSON.stringify(favoriteWorkouts));
                updateWorkoutGrid();
            });
        });
    }

    // Ensure the video stops playing when the modal is closed
    document.getElementById("videoModal").addEventListener("hidden.bs.modal", function () {
        workoutVideo.src = "";
    });

    updateWorkoutGrid();
});

