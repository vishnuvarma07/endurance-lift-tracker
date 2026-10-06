import os

from fastapi import FastAPI, Depends, HTTPException
from database import SessionLocal, Base, engine
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
import models
import schemas
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lift-tracker-rouge-ten.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


password_hasher = PasswordHash.recommended()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

models.Base.metadata.create_all(bind=engine)

def create_token(data:dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=4)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(user_id)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail = "Invalid Token")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


    

@app.post("/register")
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = password_hasher.hash(user.password)
    new_user = models.User(username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user_id": new_user.id}

@app.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db:Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if existing_user is None:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    password_check = password_hasher.verify(form_data.password, existing_user.password_hash)

    if not password_check:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    access_token = create_token(
        data={"sub": str(existing_user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/splits")
def get_splits(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    splits = db.query(models.Split).filter(models.Split.user_id == current_user.id).all()
    return splits

@app.post("/splits")
def create_split(
    split: schemas.SplitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_split = models.Split(
        name = split.name,
        user_id = current_user.id
    )

    db.add(new_split)
    db.commit()
    db.refresh(new_split)

    return new_split

@app.get("/splits/{splitId}")
def get_split(
    splitId: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(
            status_code=404,
            detail="Split not found"
        )

    return split

@app.patch("/splits/{splitId}")
def rename_split(
    splitId: int,
    update: schemas.NameUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    name = update.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be blank")
    split.name = name
    db.commit()
    db.refresh(split)
    return split


@app.patch("/splits/{splitId}/days/{dayId}")
def rename_split_day(
    splitId: int,
    dayId: int,
    update: schemas.NameUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId,
        models.SplitDay.split_id == splitId
    ).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    name = update.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name cannot be blank")
    day.name = name
    db.commit()
    db.refresh(day)
    return day


@app.get("/splits/{splitId}/days")
def get_split_days(
    splitId: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(
            status_code=404,
            detail="Split not found"
        )

    days = db.query(models.SplitDay).filter(
        models.SplitDay.split_id == splitId
    ).order_by(models.SplitDay.day_order).all()

    return days

@app.post("/splits/{splitId}/days")
def create_split_day(
    splitId: int,
    split_day: schemas.SplitDayCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(models.Split.id == splitId, models.Split.user_id == current_user.id).first()

    if split is None:
        raise HTTPException(status_code=404, detail="Split not found")

    existing_days = (
        db.query(models.SplitDay)
        .filter(models.SplitDay.split_id == splitId)
        .count()
    )

    new_split_day = models.SplitDay(
        name = split_day.name,
        split_id = split.id,
        day_order = existing_days + 1
    )

    db.add(new_split_day)
    db.commit()
    db.refresh(new_split_day)

    return new_split_day

@app.get("/splits/{splitId}/days/{dayId}")
def get_split_day(
    splitId:int,
    dayId:int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(status_code=404, detail="Split not found")

    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId,
        models.SplitDay.user_id == current_user.id
    ).first()

    if not day:
        raise HTTPException(status_code=404, detail="Split not found")

    return day

@app.post("/splits/{splitId}/days/{dayId}/exercises")
def create_exercise(
    splitId: int,
    dayId: int,
    exercise: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(status_code=404, detail="Split not found")

    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId,
        models.SplitDay.split_id == splitId
    ).first()

    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    last_exercise = db.query(models.Exercise).filter(
        models.Exercise.split_day_id == dayId
    ).order_by(
        models.Exercise.exercise_order.desc()
    ).first()

    if last_exercise:
        exercise_order = last_exercise.exercise_order + 1
    else:
        exercise_order = 1

    new_exercise = models.Exercise(
        name=exercise.name,
        target_sets=exercise.target_sets,
        split_day_id=dayId,
        exercise_order=exercise_order
    )

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    return new_exercise

@app.get("/splits/{splitId}/days/{dayId}/exercises")
def get_exercises(
    splitId: int,
    dayId:int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    day = db.query(models.SplitDay).filter(
        models.SplitDay.split_id == splitId,
        models.SplitDay.id == dayId
    ).first()

    if not day or not split:
        raise HTTPException(status_code=404, detail="Split or day not found")

    exercises = db.query(models.Exercise).filter(
        models.Exercise.split_day_id == dayId,
        models.Exercise.is_active == True
    ).order_by(
        models.Exercise.exercise_order
    ).all()

    return {
        "exercises": exercises,
        "day": day
    }

@app.post("/workouts")
def create_workout(
    workout: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    day = (
        db.query(models.SplitDay)
        .join(
            models.Split,
            models.SplitDay.split_id == models.Split.id
        )
        .filter(
            models.SplitDay.id == workout.split_day_id,
            models.Split.user_id == current_user.id
        )
        .first()
    )

    if not day:
        raise HTTPException(
            status_code=404,detail="Day not found"
        )

    new_workout = models.Workouts(
        user_id = current_user.id,
        split_day_id=workout.split_day_id,
        date=datetime.now(timezone.utc)
    )

    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)

    return new_workout

@app.post("/sets")
def create_set(
    set_data: schemas.SetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    workout = db.query(models.Workouts).filter(
        models.Workouts.id == set_data.workout_id,
        models.Workouts.user_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(
            status_code=404,
            detail="Workout not found"
        )

    exercise = db.query(models.Exercise).filter(
        models.Exercise.id == set_data.exercise_id
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found"
        )

    new_set = models.Sets(
        exercise_id=set_data.exercise_id,
        workout_id=set_data.workout_id,
        set_number=set_data.set_number,
        weight=set_data.weight,
        reps=set_data.reps
    )

    db.add(new_set)
    db.commit()
    db.refresh(new_set)

    return new_set


@app.get("/splits/{splitId}/days/{dayId}/previous-workout")
def get_previous_workout(
    splitId: int,
    dayId: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(
            status_code=404,
            detail="Split not found"
        )

    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId,
        models.SplitDay.split_id == splitId
    ).first()

    if not day:
        raise HTTPException(
            status_code=404,
            detail="Day not found"
        )

    previous_workout = db.query(models.Workouts).filter(
        models.Workouts.user_id == current_user.id,
        models.Workouts.split_day_id == dayId
    ).order_by(
        models.Workouts.date.desc()
    ).first()

    if not previous_workout:
        return {
            "previous_workout": None,
            "sets": []
        }

    # Keep the latest recorded value for each exercise/set, even when a
    # more recent session skipped that exercise or set.
    recorded_sets = (
        db.query(models.Sets)
        .join(models.Workouts, models.Sets.workout_id == models.Workouts.id)
        .filter(
            models.Workouts.user_id == current_user.id,
            models.Workouts.split_day_id == dayId
        )
        .order_by(models.Workouts.date.desc(), models.Workouts.id.desc(), models.Sets.id.desc())
        .all()
    )
    latest_sets = {}
    for recorded_set in recorded_sets:
        key = (recorded_set.exercise_id, recorded_set.set_number)
        if key not in latest_sets:
            latest_sets[key] = recorded_set

    return {
        "previous_workout": previous_workout,
        "sets": list(latest_sets.values())
    }

@app.delete("/splits/{splitId}/days/{dayId}/exercises/{exerciseId}")
def delete_exercise(
    splitId: int,
    dayId: int,
    exerciseId: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(
            status_code=404,
            detail="Split not found"
        )

    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId,
        models.SplitDay.split_id == splitId
    ).first()

    if not day:
        raise HTTPException(
            status_code=404,
            detail="Day not found"
        )

    exercise = db.query(models.Exercise).filter(
        models.Exercise.id == exerciseId,
        models.Exercise.split_day_id == dayId
    ).first()

    if not exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found"
        )

    exercise.is_active = False

    db.commit()
    db.refresh(exercise)

    return {
        "message": "Exercise removed successfully"
    }

@app.put("/splits/{splitId}/days/{dayId}/exercise-settings")
def update_exercise_settings(
    splitId: int,
    dayId: int,
    settings: schemas.ExerciseSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId, models.Split.user_id == current_user.id
    ).first()
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId, models.SplitDay.split_id == splitId
    ).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    exercises = db.query(models.Exercise).filter(
        models.Exercise.split_day_id == dayId,
        models.Exercise.is_active == True
    ).all()
    by_id = {exercise.id: exercise for exercise in exercises}
    ids = [item.id for item in settings.exercises]
    if len(ids) != len(set(ids)) or set(ids) != set(by_id):
        raise HTTPException(status_code=409, detail="Exercises changed. Close settings and reload the page before trying again.")
    for item in settings.exercises:
        if not item.name.strip() or item.target_sets < 1:
            raise HTTPException(status_code=422, detail="Each exercise needs a name and at least one set")
    for order, item in enumerate(settings.exercises, start=1):
        exercise = by_id[item.id]
        exercise.name = item.name.strip()
        exercise.target_sets = item.target_sets
        exercise.exercise_order = order
    db.commit()
    for exercise in exercises:
        db.refresh(exercise)
    return sorted(exercises, key=lambda exercise: exercise.exercise_order)


@app.put("/splits/{splitId}/days/{dayId}/exercises/{exerciseId}")
def update_exercise(
    splitId: int,
    dayId: int,
    exerciseId: int,
    exercise_data: schemas.ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    split = db.query(models.Split).filter(
        models.Split.id == splitId,
        models.Split.user_id == current_user.id
    ).first()

    if not split:
        raise HTTPException(
            status_code=404,
            detail="Split not found"
        )

    day = db.query(models.SplitDay).filter(
        models.SplitDay.id == dayId,
        models.SplitDay.split_id == splitId
    ).first()

    if not day:
        raise HTTPException(
            status_code=404,
            detail="Day not found"
        )

    old_exercise = db.query(models.Exercise).filter(
        models.Exercise.id == exerciseId,
        models.Exercise.split_day_id == dayId,
        models.Exercise.is_active == True
    ).first()

    if not old_exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found"
        )

    old_exercise.is_active = False

    new_exercise = models.Exercise(
        name=exercise_data.name,
        target_sets=exercise_data.target_sets,
        split_day_id=dayId,
        exercise_order=old_exercise.exercise_order,
        is_active=True
    )

    db.add(new_exercise)

    db.commit()
    db.refresh(new_exercise)

    return new_exercise

@app.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    workouts = db.query(models.Workouts).filter(
        models.Workouts.user_id == current_user.id
    ).all()

    workout_ids = [workout.id for workout in workouts]

    if not workout_ids:
        return {
            "total_workouts": 0,
            "total_sets": 0,
            "total_volume":0
        }

    sets=db.query(models.Sets).filter(
        models.Sets.workout_id.in_(workout_ids)
    ).all()

    total_volume = 0
    

    for set in sets:
        total_volume += set.weight * set.reps

    return {
        "total_workouts": len(workouts),
        "total_sets": len(sets),
        "total_volume": total_volume

    }

@app.get("/recent/workouts")
def get_recent_workouts(
    db:Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    workouts = (
        db.query(models.Workouts)
        .filter(models.Workouts.user_id == current_user.id)
        .order_by(models.Workouts.date.desc(), models.Workouts.id.desc())
        .limit(5)
        .all()
    )

    result = []

    for workout in workouts:
        day = (
            db.query(models.SplitDay)
            .filter(models.SplitDay.id == workout.split_day_id)
            .first()
        )

        sets = (
            db.query(models.Sets)
            .filter(models.Sets.workout_id == workout.id)
            .order_by(
                models.Sets.exercise_id,
                models.Sets.set_number
            )
            .all()
        )

        exercises = {}

        for set in sets:

            exercise = (
                db.query(models.Exercise)
                .filter(set.exercise_id == models.Exercise.id)
                .first()
            )

            if set.exercise_id not in exercises:
                exercises[set.exercise_id] = {
                    "exercise_id": set.exercise_id,
                    "name": exercise.name if exercise else "Deleted exercise",
                    "sets": []
                }

            exercises[set.exercise_id]["sets"].append({
                "set_number": set.set_number,
                "weight": set.weight,
                "reps": set.reps
            })

        result.append({
            "id": workout.id,
            "date": workout.date,
            "day_name": day.name if day else "Deleted training day",
            "exercises": list(exercises.values())
        })

    return result
