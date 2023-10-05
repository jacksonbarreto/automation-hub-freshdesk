To use this project working on your server, install 
`docker` and `docker compose` on your local machine or your remote server where you have to deploy this.

Then extract this repository, and in the root folder of this app, 
run docker compose with `-d` argument so that the processes start to work in background.

After 2 minutes, go to `localhost:4200` or `xyz.com:4200` where you deployed the app.
If you deploy on remote server, expose ports `4200` and `3000` for public access. webapp runs on 4200 and server on 4200.


Click on `Start syncing` button to sync the tickets.
Else this app would keep running in background, and on everyday midnight, a process would run to close the tickets on freshdesk.


If you want to deploy the frontend and backend on some remote server, let me know and I can configure it for you then.