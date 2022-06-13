create database forum_server;
create user postgres password 'password';
grant all privileges on database forum_server to postgres;
\c forum_server