
# Delta

Delta ($\Delta$) represents the first-order partial derivative of the option's price with respect to the underlying asset's price, i.e. $\Delta = \frac{\partial V}{\partial S}$ where $V$ is the option price and $S$ is the underlying asset's price. $\Delta$ may also be seen as the number of shares to which an option is equivalent to owning (divided by 100). For example, a stock's price rises \$1, and a derived option's price rises by \$0.8, a $\Delta$ of 0.8, thus the option (which represents the trade of 100 shares) is equivalent to owning 80 shares ($Δ \times 100 = 0.8 \times 100 = 80$) of the underlying stock. For (vanilla) call options $0 \leq \Delta \leq 1$, and for (vanilla) put options $-1 \leq \Delta \leq 0$.

A common use of $\Delta$ is calculating the appropriate hedge for a portfolio or position (delta-hedging), a concept which is crucial to the construction of the CRR model.

A related Greek exists called lambda ($\lambda$) or omega ($\Omega$) which represents the percentage change of the option value with respect to a percentage change in the underlying asset's value.


# Gamma

Gamma ($\Gamma$) represents the second-order partial derivative of the option's price with respect to the underlying asset's price, i.e. $\Gamma = \frac{\partial^2 V}{\partial S^2}$ where $V$ is the option's price and $S$ is the underlying asset's value. $\Gamma$ may also be seen as the change in delta ($\Delta$) per dollar change in the underlying asset's value, i.e. $\Gamma = \frac{\partial \Delta}{\partial S}$. $\Gamma$ is typically at it's maximum for at-the-money options, and diminishes as the option tends to deep in-the-money or out-of-the-money.

$\Gamma$ is an important consideration in delta-hedging as changes in $\Delta$ necessitate the buying or selling of the underlying asset to remain properly hedged.




