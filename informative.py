# Functionality for purely informative
# sections

import numpy as np

def get_payoff_function( strike, option_price, option_type, spot_min, spot_max, spot_step ):
    assert spot_min < spot_max
    assert spot_min < strike and strike < spot_max
    assert spot_step < spot_max - spot_min

    spot_range = range( spot_min, spot_max, spot_step )

    spot_array = np.zeros( len( spot_range + 1 ) )
    payoff_array = np.zeros( len( spot_range + 1 ) )
    profit_array = np.zeros( len( spot_range + 1 ) )

    for spot_value in spot_range:
        pass


