# Middleware mongoose

## Prequisites (Development)

| Module | Version |
| --- | --- |
| Node | 16.3.0 |
| Npm | 7.15.1 |
| Mongodb | 4.4.4 |

##### Running project in local
``` bash
> npm install

> node server.js

```
------------

##### Deployment in staging

``` bash
> git clone -b staging gitUrl folderName

> cd configs

> mv configSample.js configs.js

> vi configs.js

```
------------

##### Install node modules

> Come out of the project folder and fire 'ls' command if you find 'package.sh' then run **sh package.sh** command to install node_modules globally instead of using the command **npm install**.

##### Directory Structure
```
|-- RecruitmentPortal/
    |-- app/
        |-- locales/
            |-- de.json
            |-- en.json
            |-- es.json
        |-- modules/
            |-- base/
                |-- Controller.js
                |-- Projection.json
                |-- Routes.js
                |-- Schema.js
                |-- swagger.json
                |-- Validator.js
            |-- Dashboard/
            |-- Authentication/
            |-- ...
        |-- services/
            |-- Common.js
            |-- file.js
            |-- Seed.js
            |-- ...
    |-- configs/
        |-- configSample.js
        |-- express.js
        |-- Globals.js
        |-- mongoose.js
        |-- commonlyUsedPassword.json
    |-- node_modules/
    |-- public/
    |-- .env.sample
    |-- README.md
    |-- .gitignore
    |-- server.js
    |-- package.json
    |-- package-lock.json
    |-- sonar-project.js
    |-- swagger.json
    |-- ...
       
```
-------------

