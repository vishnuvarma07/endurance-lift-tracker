from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class ExerciseCreate(BaseModel):
    name: str
    target_sets: int


class SplitCreate(BaseModel):
    name: str

class ExerciseUpdate(BaseModel):
    name: str
    target_sets: int


class SplitDayCreate(BaseModel):
    name: str


class WorkoutCreate(BaseModel):
    split_day_id: int


class SetCreate(BaseModel):
    exercise_id: int
    workout_id: int
    set_number: int
    weight: float
    reps: int

class NameUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str


class ExerciseSettingsItem(BaseModel):
    id: int
    name: str
    target_sets: int


class ExerciseSettingsUpdate(BaseModel):
    exercises: list[ExerciseSettingsItem]
