# Vital Trak

Vital Trak is a browser-based fitness tracking application for recording workouts, setting measurable goals, and reviewing progress through an interactive dashboard. It is implemented as a front-end project and stores user data in the browser with `localStorage`; it does not currently use a backend, authentication service, or database.

## Project overview

The application provides a simple fitness workflow across several linked pages:

1. A user enters basic profile details on the login screen.
2. Vital Trak stores those details locally and opens the dashboard.
3. Workouts can be recorded with type-specific metrics such as distance for cardio or weight for strength training.
4. The dashboard summarizes activity with charts, a goal progress indicator, and a calendar of logged sessions.
5. The tracker page provides detailed history, goal management, progress feedback, and achievement tracking.

## Key features

- Local profile setup using first name, surname, and email fields.
- Workout logging for Running, Swimming, Cycling, and Strength sessions.
- Conditional workout inputs: distance for cardio activities and weight for strength sessions.
- Workout records containing type, distance or weight, calories, duration, and date.
- Dashboard visualizations for workout counts, calories burned, and average workout duration by workout type.
- FullCalendar monthly view showing saved workouts as calendar events.
- Goal creation and progress tracking for distance, weight, or calories, depending on the exercise type.
- Goal editing and removal, including progress recalculation when a goal changes.
- Workout history with search, newest/oldest sorting, and individual record removal.
- Summary metrics for total workouts, calories burned, cardio distance, and best streak.
- Achievement progress for a first workout, a seven-day streak, five kilometres of cardio distance, and 500 calories burned.
- Motivational feedback when a goal reaches halfway and notifications when goals or achievements are completed.
- Workout tutorial cards for push-ups, squats, deadlifts, bench press, planks, and dumbbell curls.
- Embedded YouTube tutorial videos opened in a Bootstrap modal.
- Favorite workout tutorials, with favorites stored and displayed first.
- Responsive layouts with mobile navigation and page-specific styling.
- A reset option for clearing workout, goal, and achievement progress.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5.3.2 for responsive layout, navigation, forms, cards, and modals
- Chart.js for dashboard charts
- FullCalendar 5.10.1 for the monthly workout calendar
- Font Awesome kit loaded on the Achievements page
- Browser `localStorage` for client-side persistence
- YouTube embeds for workout tutorials

The external libraries are loaded from CDNs in the HTML files. There is currently no build tooling or JavaScript framework in the project.

## How the application works

### Login and profile

`Login.html` presents a profile form. Submitting the form prevents the normal page request, stores the entered name, surname, and email in `localStorage`, and redirects to `HomePage.html`. This is a local profile entry flow rather than server-side authentication.

### Dashboard

`HomePage.html` and `HomePage.js` read the saved workout and goal data, greet the user, and build the dashboard views. The charts aggregate workouts by type. The calendar converts saved workout dates into events, and a circular indicator displays progress toward the most recent goal. The dashboard also includes a modal for logging a workout without leaving the page.

### Tracker and goals

`Tracker.html` and `tracker.js` provide the detailed activity workspace. The page validates workout values, updates the stored log, renders history, and recalculates summary metrics. Goals are associated with an exercise type and use a compatible measurement: distance or calories for cardio activities, and weight or calories for strength training.

### Workouts and achievements

`Workouts.html` renders a predefined workout library from `workouts.js`. Selecting **Watch tutorial** opens the relevant YouTube embed in a modal. Favorite selections are persisted and used to sort the cards.

`Achievements.html` uses the achievement logic in `tracker.js` to display locked and unlocked milestones. Progress is derived from the stored workout log, including consecutive workout dates for the seven-day streak achievement.

## Data storage

Vital Trak uses browser `localStorage` as its only persistence layer. Values are serialized as strings, with arrays and workout objects stored as JSON. The main keys are:

| Key | Purpose |
| --- | --- |
| `userName` | Saved first name |
| `userSurname` | Saved surname |
| `userEmail` | Saved email address |
| `workoutLog` | Array of logged workout records |
| `goals` | Array of user-created goals and their status flags |
| `unlockedAchievements` | Achievement identifiers already unlocked |
| `favoriteWorkouts` | Names of favorited tutorial workouts |

Because the data is stored locally, it is available only in the same browser storage context. Clearing browser site data or using the reset control removes progress, and data is not synchronized between devices or users.

## Project structure

```text
tracker-web-app/
├── Login.html             # Local profile entry and redirect
├── HomePage.html          # Dashboard layout
├── HomePage.js            # Charts, calendar, dashboard logging, and goal summary
├── Tracker.html           # Workout history, summaries, and goal controls
├── tracker.js             # Workout, goal, achievement, and localStorage logic
├── Workouts.html          # Workout tutorial library
├── workouts.js            # Tutorial cards, video modal, and favorites
├── Achievements.html       # Achievement page
├── styles.css             # Shared/login styles
├── HomePage.css            # Dashboard styles
├── tracker.css             # Tracker and shared application styles
├── Workout.css             # Workout library styles
├── Achievement.css         # Achievement page styles
└── Images/                 # Logo, workout images, and login background image
```

## Run locally

No dependency installation or build step is required.

1. Clone or download the repository.
2. Open the project folder in a local development server.
3. Open `Login.html` in a browser.
4. Enter the requested profile details and select **Login**.

For example, if Python is available:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000/Login.html](http://localhost:8000/Login.html). A local server is recommended so that all page navigation and browser behavior work consistently.

## Screenshots

Screenshots are not currently included in the repository. They can be added here as the project portfolio is updated.

<!-- Suggested screenshots:
- Login page
- Dashboard with charts and calendar
- Fitness tracker with workout history and goals
- Workout tutorial library
- Achievements page
-->

## Future improvements

- Add a backend and authenticated user accounts for secure, cross-device synchronization.
- Replace CDN-only dependencies with a managed build and dependency workflow.
- Add edit support for individual workout records and more advanced filtering.
- Improve data export and import so users can back up their local progress.
- Add stronger accessibility testing, including keyboard and screen-reader review.
- Add automated tests for validation, goal calculations, streak detection, and achievement unlocking.
- Add more workout categories, custom tutorials, and richer progress trends.

## Skills demonstrated

- Structuring a multi-page web application with reusable navigation and page-specific assets.
- Building responsive interfaces with Bootstrap and custom CSS.
- Managing DOM events, dynamic rendering, form validation, and modal interactions with vanilla JavaScript.
- Modeling workout and goal data as JSON objects and persisting it with `localStorage`.
- Aggregating client-side data for charts, summaries, calendar events, and progress indicators.
- Implementing conditional form fields and measurement-specific goal calculations.
- Working with external JavaScript libraries and embedded media.
- Handling empty states, user feedback, data normalization, and responsive layouts.

## Project status

Completed front-end portfolio project. The core experience is functional in a modern browser, with persistence limited to the current browser through `localStorage`. Backend persistence, authentication, automated testing, and production deployment are not currently included.

## Author

**Jamie Leeuw**

- GitHub: [@jamieleeuw](https://github.com/jamieleeuw)
