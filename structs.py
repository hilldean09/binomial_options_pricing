
from lattice import Lattice

class Api_Price_Inputs:
    def __init__( self, spot=None, strike=None,
                  volatility=None, risk_free_rate=None,
                  time_to_expiry=None, num_steps=None,
                  option_type=None, option_exercise=None,
                  binomial_pricing_model=None ):
        self.spot = spot
        self.strike = strike
        self.volatility = volatility
        self.risk_free_rate = risk_free_rate
        self.time_to_expiry = time_to_expiry
        self.num_steps = num_steps
        self.option_type = option_type
        self.option_exercise = option_exercise
        self.binomial_pricing_model = binomial_pricing_model

class Dividend_Inputs:
    def __init__( self, dividend_yield, ex_dividend_date_array ):
        self.dividend_yield = dividend_yield
        self.ex_dividend_date_array = ex_dividend_date_array

class Binomial_Pricing_Return_Data:
    def __init__( self, option_price, price_lattice, delta_lattice, leverage_lattice ):
        self.option_price = option_price
        self.price_lattice = price_lattice
        self.delta_lattice = delta_lattice
        self.leverage_lattice = leverage_lattice

class Black_Scholes_Return_Data:
    def __init__( self, option_price=None, delta=None, gamma=None, theta=None, vega=None, rho=None ):
        self.option_price = option_price
        self.delta = delta
        self.gamma = gamma
        self.theta = theta
        self.vega = vega
        self.rho = rho

class Convergence_Return_Data:
    def __init__( self, num_steps_array = None, binomial_price_array = None, black_scholes_price = None ):
        self.num_steps_array = num_steps_array
        self.binomial_price_array = binomial_price_array
        self.black_scholes_price = black_scholes_price


