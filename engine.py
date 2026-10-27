# Core pricing logic
import numpy as np

import math

from lattice import Lattice

def calculate_timestep( time_to_expiry, num_layers : int ):
    """
    Returns timestep length measured in months
    """
    return time_to_expiry / num_layers

def adjust_annual_value_to_step( value, timestep ):
    """
    Uses a rearrangement of the compounding
    interest formula. 

    timestep : Measured in months
    """
    return np.pow( ( 1 + value ), timestep / 12 ) - 1

def _calculate_crr_delta( spot, down_child_price, up_child_price, step_volatility ):
    # \Delta = ( C_u - C_d ) / (( u - d ) * S )
    return delta = ( up_child_price - down_child_price ) / ( 2 * step_volatility * spot )

def _calculate_crr_leverage( down_child_price, up_child_price, step_volatility, step_risk_free_rate ):
    # B = ( u*C_u - d*C_d ) / (( u - d ) * r )
    u = 1 + step_volatility
    d = 1 - step_volatility
    return delta = ( u * up_child_price - d * down_child_price ) / ( 2 * step_volatility * step_risk_free_rate )

def _calculate_virtual_spot_in_lattice( spot, step_volatility, \
                                        layer_num : int, index_in_layer : int ):
    """
      uS : diff = 1
     /
    S--- : 1.5
     \
      dS : diff = -1

    The "virtual spot" of a ndoe in the lattice
    is the spot price multiplied by any
    corresponding series of up and down moves. 

    The virtual spot can be calculated by taking
    the differnece from the median layer index
    ((layer_num + 1)/2) and the node's index
    in the layer (rounded up by magnitude, i.e.
    -1.5 -> -2)
    """
    virtual_spot = None

    median_index_in_layer = ( layer_num + 1 ) / 2 

    if index_in_layer > median_index_in_layer:
        index_in_layer_diff = int( float( index_in_layer ) - np.floor( median_index_in_layer ) )
        virtual_spot = ( 1 + step_volatility )**( index_in_layer_diff ) * spot
    elif index_in_layer < median_index_in_layer:
        index_in_layer_diff = int( np.ceil( median_index_in_layer ) - float( index_in_layer )  )
        virtual_spot = ( 1 - step_volatility )**( index_in_layer_diff ) * spot
    else: # index_in_layer == median_index_in_layer
        virtual_spot = spot

    return virtual_spot

def _run_crr_european_call_pricing( spot, strike, \
                                    step_volatility, step_risk_free_rate, \
                                    time_to_expiry, num_layers ):
    """
    Uses an iterative method as opposed
    to a recursive method to leverage 
    the lattice data structure and to
    reduce numerical errors (recalculation
    of node prices)
    """
    price_lattice = Lattice( num_layers )
    delta_lattice = Lattice( num_layers )
    leverage_lattice = Lattice( num_layers )

    number_of_nodes = price_lattice.get_number_of_nodes()

    assert number_of_nodes == delta_lattice.get_number_of_nodes()
    assert number_of_nodes == leverage_lattice.get_number_of_nodes()

    # Reverse order iteration from n-1 to 0
    for index in range( number_of_nodes - 1, -1, 0 ):
        layer_num = price_lattice.get_node_layer( index )
        index_in_layer = price_lattice.get_node_index_in_lattice( index )

        virtual_spot = _calculate_virtual_spot_in_lattice( spot, step_volatility, layer_num, index_in_layer )

        new_node_price = None
        new_node_delta = None
        new_node_leverage = None

        if price_lattice.does_node_have_child( index ):
            down_child_index = price_lattice.get_down_child( index )
            up_child_index = price_lattice.get_up_child( index )

            down_child_price = price_lattice.get_node_value( down_child_index )
            up_child_price = price_lattice.get_node_value( up_child_index )

            # C = \Delta S + B
            new_node_delta = _calculate_crr_delta( spot, down_child_price, up_child_price, step_volatility )
            new_node_leverage = _calculate_crr_leverage( down_child_price, up_child_price, step_volatility, step_risk_free_rate )
            new_node_price = new_node_delta * spot + new_node_leverage
            
        else:
            # Assumes a rational exercise policy
            new_node_price = max( 0, virtual_spot - strike )
            # TODO: Consider delta and leverage in this case

        price_lattice.set_node_value( index, new_node_price )
        delta_lattice.set_node_value( index, new_node_delta )
        leverage_lattice.set_node_value( index, new_node_leverage )

def run_crr_binomial_pricing( spot, strike, \
                              volatility, risk_free_rate, \
                              time_to_expiry, num_layers, \
                              option_type, option_exercise ):
    """
    CRR Binomial Pricing Model

    The values of u and d as defined in CRR paper
    are set to (1+volatility) and (1-volatility).
    Note that the risk-free rate of return therefore
    cannot exceed the volatility value, this is
    reasonable as per the paper's presentation of 
    related arbitrage opportunities.
    """
    assert volatility > risk_free_rate

    option_price = None
    price_lattice = None
    delta_lattice = None
    leverage_lattice = None

    timestep = calculate_timestep( time_to_expiry, num_layers )
    step_volatility = adjust_annual_value_to_step( volatility, timestep )
    step_risk_free_rate = adjust_annual_value_to_step( risk_free_rate, timestep )

    if option_type == "call":
        if option_exercise == "exercise":
            # Running CRR for European Call Options
            option_price, price_lattice, delta_lattice, leverage_lattice = _run_crr_european_call_pricing( spot, strike, step_volatility, step_risk_free_rate, time_to_expiry, num_layers )

    # TODO: Add return


def run_engine( data ):
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
        return None

    binomial_call_price = None
    binomial_pricing_lattice = None

    if binomial_pricing_model == "crr":
        binomial_call_price, binomial_pricing_lattice = \
                                 run_crr_binomial_pricing( spot, strike, \
                                                           volatility, risk_free_rate, \
                                                           time_to_expiry, num_layers, \
                                                           option_type, option_exercise )
        
    # TODO: Closed-form CRR European pricing
    # TODO: Black-Scholes pricing

    return ( binomial_call_price, binomial_pricing_lattice )

    


