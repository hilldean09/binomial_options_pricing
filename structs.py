
from lattice import Lattice

class Api_Price_Inputs:
    def __init__( self, spot, strike,
                  volatility, risk_free_rate,
                  time_to_expiry, num_layers,
                  option_type, option_exercise,
                  binomial_pricing_model ):
        self.spot = spot
        self.strike = strike
        self.volatility = volatility
        self.risk_free_rate = risk_free_rate
        self.time_to_expiry = time_to_expiry
        self.num_layers = num_layers
        self.option_type = option_type
        self.option_exercise = option_exercise
        self.binomial_pricing_model = binomial_pricing_model

class Binomial_Pricing_Return_Data:
    def __init__( self, option_price, price_lattice, delta_lattice, leverage_lattice ):
        self.option_price = option_price
        self.price_lattice = price_lattice
        self.delta_lattice = delta_lattice
        self.leverage_lattice = leverage_lattice
