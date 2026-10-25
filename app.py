# Binomial Options Pricing App

from flask import Flask

# For importing .env variables
from dotenv import load_dotenv
import os

app = Flask( __name__ )

class Environment_Variables:
    def load_evironmdnt_variables( self ):

        load_dotenv()
        # Defaulting to local host on port 5000
        self.app_host = os.getenv( "BOP_APP_HOST", default="127.0.0.1")
        self.app_port = os.getenv( "BOP_APP_PORT", default="5000" )


    def __init__( self, auto_load = True ):
        self.app_host = None
        self.app_port = None

        if auto_load:
            self.load_evironmdnt_variables()




if __name__ == "__main__":
    env_variables = Environment_Variables()

    print( f"app_host : {env_variables.app_host}" )
    print( f"app_port : {env_variables.app_port}" )

    app.run()


