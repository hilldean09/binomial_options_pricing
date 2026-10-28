# Binomial Options Pricing App

import numpy as np
import json
from flask import Flask, jsonify, request, render_template
from plotly import graph_objects as go

# For importing .env variables
from dotenv import load_dotenv
import os

# Project libraries
from lattice import Lattice
import engine

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

@app.route("/")
def api_index():
    return render_template( "index.html" )

@app.route( "/api/price", methods=["Post"] )
def api_price():
    """
    Intended to take a request in the form of a
    JSON object containing model variables and
    return a JSON object containig outputs and 
    figures.
    """
    data = request.get_json(force=True)
    binomial_output = engine.run_engine( data )

    # Debugging
    print( f"Binomial Option Price : {binomial_output.option_price}" )
    print( f"Binomials Lattices : " )
    print( f"\tPrice: {np.array2string( binomial_output.price_lattice.get_array() )}" )
    print( f"\tDelta: {np.array2string( binomial_output.delta_lattice.get_array() )}" )
    print( f"\tLeverage: {np.array2string( binomial_output.leverage_lattice.get_array() )}" )

    return json.dumps( { 
        "binomial_option_price": binomial_output.option_price,
        "binomial_lattices": {
            "price": binomial_output.price_lattice.array.tolist(),
            "delta": binomial_output.delta_lattice.array.tolist(),
            "leverage": binomial_output.leverage_lattice.array.tolist()
        }
    } )

if __name__ == "__main__":
    env_variables = Environment_Variables()

    print( f"app_host : {env_variables.app_host}" )
    print( f"app_port : {env_variables.app_port}" )

    app.run()


