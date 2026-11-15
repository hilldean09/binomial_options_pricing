# Functionality for purely informative
# sections

import numpy as np
from structs import Payoff_Function_Data

def get_payoff_function_arrays( strike, option_price, option_type, spot_min, spot_max, spot_step ):
    assert spot_min < spot_max
    assert spot_min < strike and strike < spot_max
    assert spot_step < spot_max - spot_min

    spot_range = range( spot_min, spot_max, spot_step )

    spot_array = np.zeros( len( spot_range + 1 ) )
    payoff_array = np.zeros( len( spot_range + 1 ) )
    profit_array = np.zeros( len( spot_range + 1 ) )

    payoff_value = 0.0
    profit_value = 0.0

    for index, spot_value in enumerate( spot_range ):
        if option_type == "call":
            payoff_value = max( 0, strike - spot_value )
        if option_type == "put":
            payoff_value = max( 0, spot_value - strike )
        profit_value = payoff_value - option_price

        if spot_value < strike:
            spot_array[ index ] = spot_value
            payoff_array[ index ] = payoff_value
            profit_array[ index ] = profit_value

            if spot_value + spot_step <= strike:
                spot_array[ index + 1 ] = strike
                payoff_array[ index + 1 ] = 0
                profit_array[ index + 1 ] = -1.0 * option_price

        else:
            spot_array[ index + 1 ] = spot_value
            payoff_array[ index + 1 ] = payoff_value
            profit_array[ index + 1 ] = profit_value

    output = Payoff_Function_Data( spot_array, payoff_array, profit_array )

    return output



