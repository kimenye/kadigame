KADI Developer Instructions
===========================
This Padrino application consists of an app and an admin section. For a fresh install,
 1. Configure the database.db to point to your development postgres server
 2. Run the rake migrate task
 3. Run the rake seed task to generate an admin username and password
 4. Run the app: foreman start
 5. Jasmine UI tests are available at: http://localhost:3000/jasmine?


Admin
=====
Account has been successfully created, now you can login with:
   email: admin@kadigame.com
   password: kadigame
