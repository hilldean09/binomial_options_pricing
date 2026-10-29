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

BOP_DEFAULT_MAX_DRAW_DEPTH = 50

EDGE_WIDTH = 1

##### Palette Start #####
# Agent modification allowed within this ection
COLOR_PALETTE = {
    "background" : "SOME COLOUR",
    "grid" : "SOME COLOUR",
    "muted" : "SOME COLOUR"
}

##### Palette End #####

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

##### Figures #####

def _calculate_node_lattice_figure_coordinate( index, lattice, spot, step_volatility, timestep ):
    layer_num = lattice.get_node_layer( index )
    index_in_layer = lattice.get_node_layer_index( index )

    x_coord = layer_num * timestep
    y_coord = engine._calculate_virtual_spot_in_lattice( spot, layer_num, index_in_layer )

    return ( x_coord, y_coord )

def _build_general_lattice_figure( inputs, binomial_output, lattice, max_draw_depth=None, min_value=None, max_value=None ):
    # Build coordinate lattice
    if max_draw_depth is None:
        max_draw_depth = BOP_DEFAULT_MAX_DRAW_DEPTH

    x_coord_lattice = Lattice( min( max_draw_depth, lattice.num_layers ) )
    y_coord_lattice = Lattice( x_coord_lattice.num_layers )

    edge_x_coord : list[ float | None ] = []
    edge_y_coord : list[ float | None ] = []

    coord_lattice_num_nodes = x_coord_lattice.get_num_nodes()
    assert coord_lattice_num_nodes == y_coord_lattice.get_num_nodes()

    timestep = engine.calculate_timestep( inputs.time_to_expiry, lattice.num_layers )
    step_volatility = engine.adjust_annual_value_to_step( inputs.volatility, timestep )

    for index in range( coord_lattice_num_nodes - 1, -1, -1 ):
        node_coord = _calculate_node_lattice_figure_coordinate( index, lattice, inputs.stop, step_volatility, timestep )
        x_coord_lattice.set_node_value( index, node_coord[ 0 ] )
        y_coord_lattice.set_node_value( index, node_coord[ 1 ] )

        if x_coord_lattice.does_node_have_child( index ):
            down_child_index = x_coord_lattice.get_node_down_child( index )
            up_child_index = x_coord_lattice.get_node_up_child( index )

            down_child_x_coord = x_coord_lattice.get_index_value( down_child_index )
            down_child_y_coord = y_coord_lattice.get_index_value( down_child_index )

            up_child_x_coord = x_coord_lattice.get_index_value( up_child_index )
            up_child_y_coord = y_coord_lattice.get_index_value( up_child_index )

            edge_x_coord += [ node_coord[ 0 ], down_child_x_coord, None, node_coord[ 0 ], up_child_x_coord, None ]
            edge_y_coord += [ node_coord[ 1 ], down_child_y_coord, None, node_coord[ 1 ], up_child_y_coord, None ]

    marker_size = 7

    nodes_trace = go.Scatter( name = 'nodes',
                              x = x_coord_lattice.array,
                              y = y_coord_lattice.array.
                              mode = 'markers',
                              marker = dict(
                                size = marker_size,
                                color = lattice.array,
                                colorscale = 'Viridis',
                                showscale = True,
                                colorbar = dict(
                                    outlinewidth = 0,
                                    thickness = 0,
                                )
                                # Line?
                              ),
                              showlegend = False,
                             )

    edges_trace = go.Scatter( name='edges',
                             x = edge_x_coord,
                             y = edge_y_coord,
                             mode = 'lines',
                             line = dict(
                                color = COLOR_PALETTE[ "grid" ],
                                width = EDGE_WIDTH
                             ),
                             hoverinfo = 'skip',
                             showlegend = False
                            )
    
    return nodes_trace, edges_trace


def _build_price_lattice_figure( binomial_output, timestep, max_draw_depth=None ):
    pass

def _build_delta_lattice_figure( binomial_output, max_draw_depth=None ):
    pass

def _build_leverage_lattice_figure( binomial_output, max_draw_depth=None ):
    pass


##### Routes #####

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
    # TODO: Add proper debugging flag
    # print( f"Binomial Option Price : {binomial_output.option_price}" )
    # print( f"Binomials Lattices : " )
    # print( f"\tPrice: {np.array2string( binomial_output.price_lattice.get_array() )}" )
    # print( f"\tDelta: {np.array2string( binomial_output.delta_lattice.get_array() )}" )
    # print( f"\tLeverage: {np.array2string( binomial_output.leverage_lattice.get_array() )}" )

    # NOTE: .tolist() used as np.ndarray objects
    # are not JSON serialisable
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


