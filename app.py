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
from structs import Api_Price_Inputs
import engine

app = Flask( __name__ )

BOP_DEFAULT_MAX_DRAW_DEPTH = 50

##### Front End Constants Start #####
# Agent modification allowed within this ection

BOP_COLOR_PALETTE = {
    "background" : "#121117",
    "grid" : "#3b3848",
    "edge" : "#7c5bd6",
    "paper_bgcolor" : "rgba(0,0,0,0)",
    "plot_bgcolor" : "rgba(0,0,0,0)",
    "title" : "#e8e6ef",
    "text" : "#e8e6ef",
    "muted" : "#9d99ab",
    "panel" : "#1b1a22",
    "border" : "#2c2a36"
}

BOP_NODE_MARKER_SIZE = 7
BOP_EDGE_WIDTH = 1
BOP_FIGURE_LAYOUT_TITLE_FONT_SIZE = 16
BOP_FIGURE_LAYOUT_FONT_FAMILY_STRING = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
BOP_FIGURE_LAYOUT_MARGINS = {
    "l" : 60,
    "r" : 30,
    "t" : 50,
    "b" : 50
}

BOP_FIGURE_LAYOUT_LEGEND_Y = 1.02
BOP_FIGURE_LAYOUT_LEGEND_X = 1.0

##### Front End Constants End #####

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

# Base Figure Layout Start #
# Agents may make changes within subsection

def _base_figure_layout( title : str ):
    return dict(
        title = dict( text = title, font = dict( size = BOP_FIGURE_LAYOUT_TITLE_FONT_SIZE, color = BOP_COLOR_PALETTE[ "title" ] ) ),
        paper_bgcolor = BOP_COLOR_PALETTE[ "paper_bgcolor" ],
        plot_bgcolor = BOP_COLOR_PALETTE[ "plot_bgcolor" ],
        font = dict( color = BOP_COLOR_PALETTE[ "text" ], family = BOP_FIGURE_LAYOUT_FONT_FAMILY_STRING ),
        margin = dict( l = BOP_FIGURE_LAYOUT_MARGINS[ "l" ], r = BOP_FIGURE_LAYOUT_MARGINS[ "r" ], t = BOP_FIGURE_LAYOUT_MARGINS[ "t" ], b = BOP_FIGURE_LAYOUT_MARGINS[ "b" ] ),
        hoverlabel = dict(
            bgcolor = BOP_COLOR_PALETTE[ "panel" ],
            bordercolor = BOP_COLOR_PALETTE[ "border" ],
            font = dict( color = BOP_COLOR_PALETTE[ "text" ] )
        ),
        legend = dict(
            orientation = "h",
            yanchor = "bottom",
            y = BOP_FIGURE_LAYOUT_LEGEND_Y,
            xanchor = "right",
            x = BOP_FIGURE_LAYOUT_LEGEND_X,
            font = dict( color = BOP_COLOR_PALETTE[ "muted" ] )
        )
    )

# Base Figure Layout End #

def _construct_lattice_title( inputs, binomial_output, lattice_type ):
    option_type_string = ""
    option_exercise_string = ""
    binomial_pricing_model_string = ""

    if inputs.option_type == "call":
        option_type_string = "Call"

    if inputs.option_exercise == "european":
        option_exercise_string = "European"

    if inputs.binomial_pricing_model == "crr":
        binomial_pricing_model_string = "CRR Binomial Pricing"

    if lattice_type == "price":
        lattice_type_string = "Price"
    elif lattice_type == "delta":
        lattice_type_string = "Delta"
    elif lattice_type == "leverage":
        lattice_type_string = "Leverage"

    title = binomial_pricing_modeL_string + " " + lattice_type_string + " Lattice for " + option_exercise_string + " " + option_type_string + f" for N={inputs.num_layers}"

    return title


def _calculate_node_lattice_figure_coordinate( index, lattice : Lattice, spot, step_volatility, timestep ):
    layer_num = lattice.get_node_layer( index )
    index_in_layer = lattice.get_node_layer_index( index )

    x_coord = layer_num * timestep
    y_coord = engine._calculate_virtual_spot_in_lattice( spot, layer_num, index_in_layer )

    return ( x_coord, y_coord )

def _build_general_lattice_figure( inputs, binomial_output, lattice, max_draw_depth=None ):
    # Build coordinate lattice
    if max_draw_depth is None:
        max_draw_depth = BOP_DEFAULT_MAX_DRAW_DEPTH

    x_coord_lattice = Lattice( min( max_draw_depth, lattice.num_layers ) )
    y_coord_lattice = Lattice( x_coord_lattice.num_layers )

    edge_x_coord : list[ float | None ] = []
    edge_y_coord : list[ float | None ] = []

    coord_lattice_num_nodes = x_coord_lattice.get_number_of_nodes()
    assert coord_lattice_num_nodes == y_coord_lattice.get_number_of_nodes()

    timestep = engine.calculate_timestep( inputs.time_to_expiry, lattice.num_layers )
    step_volatility = engine.adjust_annual_value_to_step( inputs.volatility, timestep )

    for index in range( coord_lattice_num_nodes - 1, -1, -1 ):
        node_coord = _calculate_node_lattice_figure_coordinate( index, lattice, inputs.spot, step_volatility, timestep )
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

    nodes_trace = go.Scatter( name = 'nodes',
                              x = x_coord_lattice.array,
                              y = y_coord_lattice.array,
                              mode = 'markers',
                              marker = dict(
                                size = BOP_NODE_MARKER_SIZE,
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
                                color = BOP_COLOR_PALETTE[ "edge" ],
                                width = BOP_EDGE_WIDTH
                             ),
                             hoverinfo = 'skip',
                             showlegend = False
                            )

    traces = [ nodes_trace, edges_trace ]

    figure = go.Figure( data = traces )

    return figure

def _build_price_lattice_figure( inputs, binomial_output, max_draw_depth=None ):
    figure = _build_general_lattice_figure( inputs, binomial_output, binomial_output.price_lattice, max_draw_depth=max_draw_depth )

    title = _construct_lattice_title( inputs, binomial_output, "price" )
    layout = _base_figure_layout( title )
    layout.update(
        xaxis = dict( 
            title = "Time (months)",
            gridcolor = BOP_COLOR_PALETTE[ "grid" ],
            zeroline = False,
            color = BOP_COLOR_PALETTE[ "muted" ]
        ),
        yaxis = dict( 
            title = "Option Price (dollars)",
            gridcolor = BOP_COLOR_PALETTE[ "grid" ],
            zeroline = False,
            color = BOP_COLOR_PALETTE[ "muted" ]
        )
    )

    figure.update_layout( layout )
    return figure


def _build_delta_lattice_figure( inputs, binomial_output, max_draw_depth=None ):
    figure = _build_general_lattice_figure( inputs, binomial_output, binomial_output.delta_lattice, max_draw_depth=max_draw_depth )

    title = _construct_lattice_title( inputs, binomial_output, "delta" )
    layout = _base_figure_layout( title )
    layout.update(
        xaxis = dict( 
            title = "Time (months)",
            gridcolor = BOP_COLOR_PALETTE[ "grid" ],
            zeroline = False,
            color = BOP_COLOR_PALETTE[ "muted" ]
        ),
        yaxis = dict( 
            title = "Delta (shares)",
            gridcolor = BOP_COLOR_PALETTE[ "grid" ],
            zeroline = False,
            color = BOP_COLOR_PALETTE[ "muted" ]
        )
    )

    figure.update_layout( layout )
    return figure


def _build_leverage_lattice_figure( inputs, binomial_output, max_draw_depth=None ):
    figure = _build_general_lattice_figure( inputs, binomial_output, binomial_output.leverage_lattice, max_draw_depth=max_draw_depth )

    title = _construct_lattice_title( inputs, binomial_output, "leverage" )
    layout = _base_figure_layout( title )
    layout.update(
        xaxis = dict( 
            title = "Time (months)",
            gridcolor = BOP_COLOR_PALETTE[ "grid" ],
            zeroline = False,
            color = BOP_COLOR_PALETTE[ "muted" ]
        ),
        yaxis = dict( 
            title = "Leverage (dollars)",
            gridcolor = BOP_COLOR_PALETTE[ "grid" ],
            zeroline = False,
            color = BOP_COLOR_PALETTE[ "muted" ]
        )
    )

    figure.update_layout( layout )
    return figure


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
    spot = None
    strike = None
    volatility = None
    risk_free_rate = None
    time_to_expiry = None
    num_layers = None
    option_type = None
    option_exercise = None
    binomial_pricing_model = None

    data = request.get_json(force=True)

    try:
        spot = float( data[ "spot" ] )
        strike = float( data[ "strike" ] )
        volatility = float( data[ "volatility" ] )
        risk_free_rate = float( data[ "risk_free_rate" ] )

        # Time-to-expiry in months to reduce
        # possible floating point error
        time_to_expiry = float( data[ "time_to_expiry" ] )

        num_layers = float( data[ "num_layers" ] )

        option_type = data.get( "option_type", "call" )
        option_exercise = data.get( "option_exercise", "european" )
        binomial_pricing_model = data.get( "pricing_model", "crr" )
    except:
        # TODO: Add some more significant response
        pass

    inputs = Api_Price_Inputs( spot = spot, strike = strike, volatility = volatility, risk_free_rate = risk_free_rate, time_to_expiry = time_to_expiry, num_layers = num_layers, option_type = option_type, option_exercise = option_exercise, binomial_pricing_model = binomial_pricing_model )
    binomial_output = engine.run_engine( inputs)

    price_lattice_figure = _build_price_lattice_figure( inputs, binomial_output, BOP_DEFAULT_MAX_DRAW_DEPTH )
    delta_lattice_figure = _build_delta_lattice_figure( inputs, binomial_output, BOP_DEFAULT_MAX_DRAW_DEPTH )
    leverage_lattice_figure = _build_leverage_lattice_figure( inputs, binomial_output, BOP_DEFAULT_MAX_DRAW_DEPTH )

    # Debugging
    # TODO: Add proper debugging flag
    # print( f"Binomial Option Price : {binomial_output.option_price}" )
    # print( f"Binomials Lattices : " )
    # print( f"\tPrice: {np.array2string( binomial_output.price_lattice.get_array() )}" )
    # print( f"\tDelta: {np.array2string( binomial_output.delta_lattice.get_array() )}" )
    # print( f"\tLeverage: {np.array2string( binomial_output.leverage_lattice.get_array() )}" )

    # NOTE: .tolist() used as np.ndarray objects
    # are not JSON serialisable
    output = { 
        "binomial_option_price": binomial_output.option_price,
        "binomial_lattices": {
            "price": binomial_output.price_lattice.array.tolist(),
            "delta": binomial_output.delta_lattice.array.tolist(),
            "leverage": binomial_output.leverage_lattice.array.tolist()
        },
        "figures": {
            "lattices" : {
                "price" : json.loads( json.dumps( price_lattice_figure, cls=plotly.utils.PlotlyJSONEncoder ) ),
                "delta" : json.loads( json.dumps( delta_lattice_figure, cls=plotly.utils.PlotlyJSONEncoder ) ),
                "leverage" : json.loads( json.dumps( leverage_lattice_figure, cls=plotly.utils.PlotlyJSONEncoder ) )
            }
        }
    }

    return jsonify( output )

if __name__ == "__main__":
    env_variables = Environment_Variables()

    print( f"app_host : {env_variables.app_host}" )
    print( f"app_port : {env_variables.app_port}" )

    app.run()


