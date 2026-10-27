
from lattice import Lattice

class Binomial_Pricing_Return_Data:
    def __init__( self, option_price, price_lattice, delta_lattice, leverage_lattice ):
        self.option_price = option_price
        self.price_lattice = price_lattice
        self.delta_lattice = delta_lattice
        self.leverage_lattice = leverage_lattice
