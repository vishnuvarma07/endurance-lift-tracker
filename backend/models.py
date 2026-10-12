from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)


class Split(Base):
    __tablename__ = "split"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)


class SplitDay(Base):
    __tablename__ = "split_day"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    split_id = Column(Integer, ForeignKey("split.id"), nullable=False)
    day_order = Column(Integer, nullable=False)


class Exercise(Base):
    __tablename__ = "split_day_exercises"

    id = Column(Integer, primary_key=True)
    split_day_id = Column(Integer, ForeignKey("split_day.id"), nullable=False)
    name = Column(String, nullable=False)
    exercise_order = Column(Integer, nullable=False)
    target_sets = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)


class Workouts(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    split_day_id = Column(Integer, ForeignKey("split_day.id"), nullable=False)
    date = Column(DateTime, nullable=False)


class Sets(Base):
    __tablename__ = "sets"

    id = Column(Integer, primary_key=True)
    exercise_id = Column(
        Integer,
        ForeignKey("split_day_exercises.id"),
        nullable=False
    )
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)



class ExerciseNote(Base):
    __tablename__ = "exercise_notes"

    exercise_id = Column(Integer, ForeignKey("split_day_exercises.id"), primary_key=True)
    content = Column(String, nullable=False, default="")
