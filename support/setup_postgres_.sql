create database forum-server;
create user postgres password 'password';
grant all priviledges on database forum-server to postgres;
\c forum-server