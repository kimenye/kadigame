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


Facebook integration
====================

Facebook test users
-------------------

https://graph.facebook.com/176867685781434/accounts/test-users?access_token=176867685781434|BLPB-wAqMo2N4ul9B9WVlSVwaeQ

App Id:
-------
176867685781434

App Secret:
-----------
3fc9252d9265dbc14e45a0a3f4e27298

OAuth Token:
------------
176867685781434|BLPB-wAqMo2N4ul9B9WVlSVwaeQ

https://graph.facebook.com/oauth/access_token?client_id=176867685781434&client_secret=3fc9252d9265dbc14e45a0a3f4e27298&grant_type=client_credentials

Documentation:
--------------
http://developers.facebook.com/docs/test_users/

Creating users:
---------------
https://graph.facebook.com/176867685781434/accounts/test-users?installed=true&name=FULL_NAME&locale=en_US&permissions=read_stream&method=post&access_token=176867685781434|BLPB-wAqMo2N4ul9B9WVlSVwaeQ



Makmende:
---------
{
   "id": "100004303570767",
   "access_token": "AAACg3DeVT7oBANv2AEZB3zEi7k8CDc0jZBRms0q1STBGq9NaZCa8MSWctzmqZC1KCSR0aZCZA7cRaClQZCKvfCYsHe0c7ZCW8ZAqqcEeNTMjNZBSfVrhKCR1GZA",
   "login_url": "https://www.facebook.com/platform/test_account_login.php?user_id=100004303570767&n=JdRBVW1fHKxlU3v",
   "email": "makmende_akaktic_makmende\u0040tfbnw.net",
   "password": "1701908397"
}

Prezzo:
-------
{
   "id": "100004432652693",
   "access_token": "AAACg3DeVT7oBAK8dZA19M1LQhN950PER2qQMI5c73cCHssfflFok5RwGHLitQAOPm4QHZC2nny7kTp0Fzq6mwTGINIE2IirmxKJ91le8aUvOJqBlbp",
   "login_url": "https://www.facebook.com/platform/test_account_login.php?user_id=100004432652693&n=IBZSGRig0RAGHjr",
   "email": "prezzo_pqkizeq_prezzo\u0040tfbnw.net",
   "password": "1719860592"
}

Karucy:
-------
{
   "id": "100004430102934",
   "access_token": "AAACg3DeVT7oBADZBaVugWvn11h3FDqO5ToBtIpxBJU3vawjF4628MBylMfBk48ZCX0wGtb9OI4F4n9ZAnJ3GIZAKvdVs8h9XK1ZBwD2CZCb9TKQmejMBvn",
   "login_url": "https://www.facebook.com/platform/test_account_login.php?user_id=100004430102934&n=hxRPomiatp8mIkB",
   "email": "karucy_ykeghok_karucy\u0040tfbnw.net",
   "password": "340159248"
}