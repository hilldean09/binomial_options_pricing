# Binomial Options Pricing App

from flask import Flask

# For importing .env variables
from dotenv import load_dotenv
import os

app = Flask( __name__ )



if __name__ == "__main__":
    # Getting environment variables
    load_dotenv()
    app_host = os.getenv( BOP_APP_HOST )
    app_port = os.getenv( BOP_APP_PORT )

    print( f"app_host : {app_host}" )
    print( f"app_port : {app_port}" )

    app.run()


