
# The CRR Binomial Options Pricing Model

The Cox, Ross, Rubinstein (CRR) binomial options pricing model is a discrete model for the risk-neutral valuation of options prices and reproduces the famous Black-Scholes and jump process options pricing formulas in the limiting cases.

The core of the CRR binomial options pricing model is a two-state simplification of the underlying asset's return over a period whereby arbitrage (riskless trading strategies) arguments can be applied to derive a price for an option on the underlying asset. The model produces a closed-form solution for the price of an option on non-dividend-paying underlying assets with the exception of American puts and can recursively compute a price for dividend-paying underlying assets for European and American calls and puts.

## Risk-Neutral Valuation and the CRR Model

Risk-neutral valuation, in the context of financial instruments, refers to a method of evaluating the price of an asset or instrument as if investors are indifferent to risk (either by assumption or necessity).

The CRR model, under its assumptions and as we will see, does not depend on whether an investor is risk-averse or risk-inclined; to quote the authors, "\[i\]n constructing the formula, the only assumption we made about an individual's behaviour was that \[they\] prefer\[\] more wealth to less wealth".

## Two-State Simplification

The model assumes that over one period of some length a stock either moves geometrically by $u$ or $d$ with probabilities $q$ and $1-q$ respectively, where $u>d$. That is,
$$
S_{i+1} = \begin{cases} uS_i \quad & \text{with probability }q \\
                        dS_i \quad & \text{with probability }(1-q) \end{cases} ,
$$
where $S_{i+1}$ indicates the spot price one period after $S_i$. We stated the requirement $u>d$; however, we must also impose $u > r > d$ where $r$ is one plus risk-free interest rate (the risk-free rate) over the period, i.e. the growth factor, to avoid arbitrage opportunities; note that this assumes the risk-free rate remains constant over the period.

Note that for American options we assume that exercise is only possible at the beginning or end of each period.

## Valuation by Arbitrage Arguments

To price an option on a non-dividend-paying underlying asset under the two-state simplification we first consider an option that is one period from expiry with spot price $S$ and strike price $K$ (we will find that in the non-dividend-paying case European and American call options are priced equivalently). The payoff at expiry of such an option is 
$$
\begin{cases}
C_u = \max\left[ 0, uS - K \right] \quad & \text{with probability } q \\ 
C_d = \max\left[ 0, dS - K \right] \quad & \text{with probability } (1-q)
\end{cases},
$$
in the call case, or in the put case
$$
\begin{cases}
P_u = \max\left[ 0, K - uS \right] \quad & \text{with probability } q \\ 
P_d = \max\left[ 0, K - dS \right] \quad & \text{with probability } (1-q)
\end{cases}.
$$
$C$ and $P$ will be used to denote call and put options respectively and their prices.

To price the option via arbitrage arguments we wish to construct a portfolio in the present that is equivalent to the option's payoff one period out at expiry. To achieve this, we consider two instruments: the underlying asset and risk-free bonds. The portfolio, referred to as the hedging portfolio, is comprised of $\Delta$ units of the underlying asset, where each unit represents the quantity specified by the option contract, and $B$ dollars of lending via risk-free bonds; negative $\Delta$ implies selling units of the underlying asset and negative $B$ implies borrowing via risk-free bonds. The cost of the hedging portfolio is

$$
\Delta S + B .
$$

In the world where the underlying asset's value is $uS$ at expiry (with probability $q$), the hedging portfolio has value $\Delta (uS) + rB$. In the world where the underlying asset's value is $dS$ at expiry (with probability $1-q$), the hedging portfolio has value $\Delta (dS) + rB$.

Equating the hedging portfolio to the option payoff at expiry in the two cases produces the system of equations
$$
\begin{cases}
\Delta (uS) + rB = \max\left[ 0, uS - K \right] = C_u \\
\Delta (dS) + rB = \max\left[ 0, dS - K \right] = C_d
\end{cases} .
$$
Solving for $\Delta$ and $B$ gives
$$
\Delta = \frac{C_u - C_d}{(u-d)S} \quad \text{and} \quad B = \frac{uC_d - dC_u}{(u-d)r} ,
$$
and analogously for puts. $\Delta$ and $B$ will henceforth refer, unless stated otherwise, to these solutions of the system of equations.

We now show that no rational investor would value the option below the cost of the hedging portfolio. If an option is priced at $C$ below the cost of the hedging portfolio $\Delta S + B$, we will buy the option and sell the hedging portfolio. At expiry, the value of the option and hedging portfolio will be equivalent, as we have just shown; therefore, the overall value of our positions at expiry is zero and we profit by the difference between the call and hedging portfolio prices $( \Delta S + B ) - C > 0$. However, if the option is priced above the cost, depending on whether the option is European or American, there exist separate arbitrage opportunities (consider the converse of the previous argument and the opportunity for immediate exercise respectively). Finally, under the assumption that the risk-free interest rate is positive (negative interest rates do occur but are considered rare and unconventional) we find that for a option, with the exception of American puts, with one period to expiry under the two-state simplification
$$
C = \Delta S + B \quad \text{and } \quad P = \Delta S + B .
$$
Considering the expansion of $\Delta$ and $B$ and defining
$$
p = \frac{r-d}{u-d} \quad \text{and } \quad 1-p = \frac{u-r}{u-d} ,
$$
we can simplify the option pricing expression to
$$
C = \frac{ p C_u + \left(1-p\right) C_d }{ r } \quad \text{and } \quad P = \frac{ p P_u + \left(1-p\right) P_d }{ r } .
$$
Note that it can be proven $p$ has the properties of a probability which, after the extension to arbitrary numbers of periods, to the closed-form binomial of the CRR pricing model.

We now address the exclusion of American put options. In the non-dividend-paying case and assuming a positive risk-free rate ($r>1$) is positive, it can be proven that early exercise is never optimal for American call option (consider comparing the pricing formulas to $S-K$), however early exercise can be very well optimal for American put options, as such for their pricing we must defer to pricing under early exercise which will be covered later.

## Some Key Features

Note that, as we promised to show, the CRR pricing model does not depend on, or make any assumptions about, investors' attitude to risk, instead arguing a price via the assumption that investors do not wish to be on the sadder end of riskless arbitrage opportunities. Additionally, the CRR pricing model does not depend on investors' opinions on $q$ (the probability that the underlying asset's value moves geometrically by $u$). It is clear to see that this is therefore quite the powerful valuation tool.

## Pricing of Options $\geq 2$ Periods From Expiry

To price options $\geq 2$ periods from expiry, we simply recursively apply the pricing formula, but instead of $C_u$ and $C_d$ denoting the payoff at expiry they denote the option price after the underlying asset's price moves by $u$ and $d$ respectively. We assume that $u$ and $d$ remain constant (and by proxy this will assume that volatility, $\sigma$, is constant) through the chosen number of periods.

In implementation, this can be thought of as computing the option price at each node layer-by-layer, starting from expiry, in the lattices seen in the "Pricer" section of this app.

Note that as time moves forward and the underlying asset's value traverses the available paths under the two-state simplification, the values of $\Delta$ and $B$ change depending on the underlying asset's movement and thus the hedging portfolio need be updated.

## Pricing Options on Dividend-Paying Assets and Early Exercise

We will now consider pricing options conditioned on dividend-paying underlying assets and the resulting complications of early exercise in the American option case. We will only present the case for which the asset pays a constant dividend yield (or constant on the period with which we are concerned at the very least) though the methodology can be expanded to dividends as an arbitrary function on known information. The core mechanism is that upon an ex-dividend date (the date before which one must hold an asset to be entitled to the next dividend payment) the asset's value declines by the dividend yield on one unit (considering a company's literal capital decreasing by the total dividends paid to all shareholders). We assume that the dividend yield and ex-dividend dates are perfectly known.

Previously we stated that in the non-dividend-paying underlying asset case early exercise is never optimal for call options; however, in the dividend-paying case this is not strictly true. Early exercise is optimal where the immediate payoff of the option exceeds the value of the hedging portfolio at that instant, that is when
$$
\frac{ p C_u + \left(1-p\right) C_d }{ r } < S - K \quad \text{or } \quad \frac{ p P_u + \left(1-p\right) P_d }{ r } < K - S 
$$
in the call and put cases respectively.

## Definition of $u$ and $d$ for Black-Scholes as a Limiting Case

For a given option on a non-dividend paying underlying asset, excluding American puts, as the number of periods tend to infinity (and the length of said periods tend to $0$ to maintain the time to expiry) the CRR binomial options pricing model converges to the Black-Scholes options pricing model. We will not prove the result here however will state how $u$ and $d$ are defined and do good on our promise to show that assuming constant $u$ and $d$ imposes assuming $\sigma$ constant in practical application.

We define $u$ and $d$ as
$$
u = e^{\sigma \sqrt{\frac{t}{n}} } \quad \text{and } \quad d = e^{-\sigma \sqrt{\frac{t}{n}} }
$$
where $\sigma$ is the annual volatility of the asset, $t$ is the time to expiry in years, and $n$ is the number of periods (of course we can similarly translate the mutual unit of time, in this case years, to whatever we please).

Note that the assumption of constant volatility and requiring volatility as an input parameter is a core limitation of the CRR model. If the debacle of requiring volatility as an input parameter is not immediately clear consider that realized volatility is a latent process (takes time to reflect regime changes) and using implied volatility is circular, effectively chasing the market.


