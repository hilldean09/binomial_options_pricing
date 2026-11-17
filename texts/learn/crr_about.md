
# The CRR Binomial Options Pricing Model

The Cox, Ross, Rubinstein (CRR) binomial options pricing model is a discrete model for the risk-neutral valuation of options prices and reproduces the famous Black-Scholes and jump process options pricing formulas in the limiting cases.

The core of the CRR binomial options pricing model is a two-state simplification of the underlying asset's return over a period whereby arbitrage (riskless trading strategies) arguments can be applied to derive a minimum price for an option on the underlying asset. The model produces a closed-form solution for the price of an option on non-dividend paying underlying assets and can recursively compute a price for dividend paying underlying assets in both the European and American cases.

## Risk-Neutral Valuation and the CRR Model

Risk-neutral valuation, in the context of financial instruments, refers to a method of evaluating the price of an asset or instrument where investors are indifferent to risk (either by assumption or necessity).

The CRR model, under it's assumptions and as we will see, does not depend on whether an investor is risk-adverse or risk-inclined, to quote the authors "\[i\]n constructing the formula, the only assumption we made about an individual's behaviour was that \[they\] prefer\[\] more wealth to less wealth".

## Two-State Simplification

The model assumes that over one period of some length a stock either moves geometrically by $u$ or $d$ with probabilities $q$ and $1-q$ respectively, where $u>d$. That is 

$$
S_{i+1} = \begin{cases} uS_i \quad & \text{with probability }q \\
                        dS_i \quad & \text{with probability }(1-q) \end{cases} .
$$

Where $S_{i+1}$ indicates the spot price one period after $S_i$. We stated the requirement $u>d$, however we must also impose $u > r$ where $r$ is the risk-free interest rate over the period (the risk-free rate) to avoid arbitrage opportunities; note that this assumes the risk-free rate remains constant over the period.

Note that for American options we assume that exercise is only possible at each beginning or end of each period.

## Valuation by Arbitrage Arguments

To price an option on a non-dividend paying underlying asset under the two-state simplification we first consider an option that is one period from expiry with spot price $S$ and strike price $K$ (we will find that in the non-dividend paying case European and American options are priced equivalently). The payout at expiry of such an option is 
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

To price the option via arbitrage arguments we wish to construct a portfolio in the present that is equivalent to the option's payoff one period out at expiry, to achieve this we consider two instruments; the underlying asset and risk-free bonds. The portfolio, referred to as the hedging portfolio is comprised of $\Delta$ units of the underlying asset, where each unit represents the quantity specified by the option contract, and $B$ borrowed dollars of risk-free bonds; negative $\Delta$ implies selling units of the underlying asset and negative $B$ implies lending via risk-free bonds. The cost of the hedging portfolio is

$$
\Delta S + B .
$$

In the world where the underlying asset's value is $uS$ at expiry (with probability $q$) the hedging portfolio has value $\Delta (uS) + rB$. In the world where the underlying asset's value is $dS$ at expiry (with probability $1-q$) the hedging portfolio has value $\Delta (dS) + rB$.

Equating the hedging portfolio to the option payoff at expiry in the two cases produce the system of equations
$$
\begin{cases}
\Delta (uS) + rB = \max\left[ 0, uS - K \right] = C_u \\
\Delta (dS) + rB = \max\left[ 0, dS - K \right] = C_d
\end{cases} .
$$
Solving for $\Delta$ and $B$ gives
$$
\Delta = \frac{C_u - C_d}{(u-d)S} \quad \text{and} \quad B = \frac{uC_d - dC_u}{(u-d)r} .
$$
$\Delta$ and $B$ will henceforth refer, unless stated otherwise, to these solution of the system of equations.

We now show that no rational investor would value the option below the cost of the hedging portfolio. If an option is priced at $C$ below the cost of the hedging portfolio $\Delta S + B$ we will buy the option and sell the hedging portfolio. At expiry the value of the option and hedging portfolio will be equivalent as we have just shown, therefore the overall value of our positions at expiry is zero and we profit the difference between the call and hedging portfolio prices $( \Delta S + B ) - C > 0$. However, if the option is priced above the cost depending on whether the option is European or American there exist separate arbitrage opportunities (consider the converse of the previous argument and the opportunity for immediate exercise respectively. Finally, under the assumption that the risk-free interest rate is positive (negative interest rates do occur but are considered rare and unconventional) we find that for an option with one period to expiry under the two state simplification
$$
C = \Delta S + B \quad \text{and } \quad P = \Delta S + B .
$$
Considering the expansion of $\Delta$ and $B$ and defining
$$
p = \frac{r-d}{u-d} \quad \text{and } \quad 1-p = \frac{u-r}{u-d} ,
$$
we can simply the option pricing expression to
$$
C = \frac{ p C_u + \left(1-p\right) C_d }{ r } \quad \text{and } \quad P = \frac{ p P_u + \left(1-p\right) P_d }{ r } .
$$
Note that it can be proven that under the assumption $p$ has the properties of a probability which leads to the closed-form of the CRR binomial pricing model.

Additionally, in the non-dividend paying case and assuming $r$ is positive it can be proven that early exercise is never optimal (consider comparing the pricing formulas to $S-K$ and $K-S$ for call and put options respectively).

## Some Key Features

Note that, as we promised to show, the CRR pricing model does not depend or make any assumptions on investors attitude to risk instead arguing a price via the assumption that investors do not wish to be on the sadder end of riskless arbitrage opportunities. Additionally the CRR pricing model does not depend on investors opinions on $q$ (the probability that the underlying asset's value moves geometrically by $u$). In combination, it does not matter 

## Pricing of Options $\geq 2$ Periods From Expiry

To price options $\geq 2$ periods from we simply recursively apply the pricing formula, but instead of $C_u$ and $C_d$ denoting the payoff at expiry they denote the option price after the underlying assets price moves by $u$ and $d$ respectively. We assume that $u$ and $d$ remain constant (and by proxy this will assume that volatility, $\sigma$ is constant) through the chosen number of periods.

In implementation this can be thought of computing the option price at each node layer-by-layer, starting from expiry, in the lattices seen in the "Pricer" section of this app.

Note that as time moves forward and the underlying asset's value traverses the available paths under the two-state simplification the values of $\Delta$ and $B$ change depending on the underlying asset's movement and thus the hedging portfolio need be updated.

## Pricing Options on Dividend Paying Assets and Early Exercise

We will now consider pricing options conditioned on dividend paying underlying assets and the resulting complications of early exercise in the American option case. We will only present the case for which the asset pays a constant dividend yield (or constant on the period with which we are concerned at the very least) though the methodology can be expanded to dividends as an arbitrary function on known information. The core mechanism is that upon an ex-dividend date (the data at which one must hold an asset to be entitled to the next dividend payment) the asset's value declines by the dividend yield (considering a company's literal capital decreasing by the dividend yield per share). We assume that the dividend yield and ex-dividend dates are perfectly known.

Previously we stated that in the non-dividend paying underlying asset case early-exercise is never optimal, however in the dividend paying case this is not strictly true. Early-exercise is optimal where the immediate payoff of the option exceed the value of the hedging portfolio at that instance, that is when
$$
\frac{ p C_u + \left(1-p\right) C_d }{ r } < S - K \quad \text{or } \quad \frac{ p P_u + \left(1-p\right) P_d }{ r } < K - S 
$$
in the call and put cases respectively.


