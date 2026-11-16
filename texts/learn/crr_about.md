
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


## Valuation by Arbitrage Arguments

To price an option on a non-dividend paying underlying asset under the two-state simplification we first consider a European option that is one period from expiry with spot price $S$ and strike price $K$ (we will find that in the non-dividend paying case European and American options are priced equivalently). The payout at expiry of such an option is 
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

To price the option via arbitrage arguments we wish to construct a portfolio in the present that is equivalent to the option's payoff one period out at expiry, to achieve this we consider two instruments; the underlying asset and risk-free bonds. The portfolio, referred to as the hedging portfolio is comprised of $\Delta$ units of the underlying asset, where each unit represents the quantity specified by the option contract, and $B$ dollars of risk-free bonds; negative $\Delta$ implies selling units of the underlying asset and negative $B$ implies the lending of risk-free bonds. The cost of the hedging portfolio is

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

We now show that no rational investor would value the option below the cost of the hedging portfolio. If an option is priced at $C$ below the cost of the hedging portfolio $\Delta S + B$ we will buy the option and sell the hedging portfolio. At expiry the value of the option and hedging portfolio will be equivalent as we have just shown, therefore the overall value of our positions at expiry is zero and we profit the difference between the call and hedging portfolio prices $( \Delta S + B ) - C > 0$.



