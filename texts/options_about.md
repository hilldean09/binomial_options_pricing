
# Options (Briefly)

For the sake of clarity (and many an asterisk) the following explanation will only be concerned with vanilla options, e.g. European and American puts and calls.

An option (or options-contract) is am agreement granting the buyer of the contract, at some price, the right, but not obligation, to buy pr sell a specified amount of an underlying asset or instrument from or to the seller at a specified price up until or at a specified date in the future. Typically we are concerned with publicly traded options contracts which follow a standardised format and are traded over an exchange, though so called over-the-counter (OTC) options exist whereby parties deal and tailor the contract with the other directly. An option contract includes settlement terms which specify whether the underlying asset must be delivered to the relevant party or whether the respective monetary amount may be paid in lieu.

Some terminology:
- The *spot price* refers to the price of the underlying asset at the sale of option or current price (usually made clear if not equivalent by the context).
- The *strike price* refers to the agreed price in the future at which the underlying asset can be traded.
- *Exercising an option* refers to buyer exercising their right to buy from or sell to the seller of the option, transacting the underlying asset.
- The *expiration date*, (pretty self-evidently) refers to the date at which an option expires, for some options this is the only date at which the option can be exercised, for others this is the final date at which the option can be exercised.
- *Time-to-expiry* (or time-to-maturity) refers to the duration of time between the sale of the option and the expiration date or between the present and the expiration (again typically made clear, if not equivalent, by the context).
- The *premium* of an option is the price the buyer pays the seller to hold the right (but not obligation) to exercise the option, i.e. the price of the option.

Additionally, we will henceforth refer to the underlying asset and the agreed quantity thereof simply as the *underlying*.

## European Style Option

A *European style option*, or just European option is an option whereby the buyer can only exercise the option (their right to buy or sell the underlying depending on the type) on the expiration date and not at anytime before. European options are, by most metrics, the simplest.

## American Style Option

An *American style option*, or, again, just American option, is whereby the buyer may exercise the option at any time up and until the expiration date. Exercising the option prior to the expiration date is referred to as an early exercise and can introduce some computational difficulties when handling valuation.

## Call Options

A call options grants the buyer the right, but not obligation to *buy* the underlying at the strike price upon exercise. 

The buyer of a call option is said to be *long* the call and profits from the underlying asset increasing in price. The seller of a call option is said to *write* the call and *short* the call. The writer of a call profits from the underlying asset decreasing in price.

## Put Options

The counterpart to call options, a put option grants the buyer the right, but not obligation to sell the underlying to the seller of the put at the agreed strike price upon exercising the option.

Analogously to calls, the buyer of a put option is said to be long the put and profits from the underlying asset decreasing in price. The seller of a put is said to write and be short the put, profiting from the underlying asset increasing in price.

## The Payoff Function

The *payoff function* of an option refers to the realised return upon exercising the option as a function of the spot price at exercise. Below we plot the payoff function for your given parameters; to explore the function try altering the options type (call or put) and the strike price.

!!!INSERT PAYOFF FUNCTION FIGURE AREA!!!

Coincidentally, the shape of the payoff and profits functions may seem familiar from the field of machine learning as the rectified linear unit (ReLU) function.


