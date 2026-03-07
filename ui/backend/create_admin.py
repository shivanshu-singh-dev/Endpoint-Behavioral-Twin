from getpass import getpass

from app.database import ui_db
from app.security import hash_password


def main():
    username = input("Admin username: ").strip()
    password = getpass("Admin password: ")

    with ui_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                print("User already exists")
                return
            cursor.execute(
                "INSERT INTO users (username, password_hash, role, created_at) VALUES (%s, %s, 'admin', NOW())",
                (username, hash_password(password)),
            )
        conn.commit()
    print("Admin user created")


if __name__ == "__main__":
    main()
