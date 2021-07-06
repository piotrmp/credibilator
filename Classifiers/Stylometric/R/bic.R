# Created by PT
# Sparsified and adjusted for glmnet model by PP

select_lambda = function(glmnet_model,y,x,pen,gamma=1){
  #Funkcja wybiera lambda uzywajac kryteriow AIC/BIC/EBIC
  est_beta_matrix=rbind(glmnet_model$a0,glmnet_model$beta)
  lambda_seq=glmnet_model$lambda
  if(is.factor(y)){
    rl = levels(y)
    ynum = ifelse(y==rl[2],1,0)
    y = ynum
  }
  lambda_seq = lambda_seq[1:ncol(est_beta_matrix)]
  
  n = length(y)
  p = nrow(est_beta_matrix)
  if(pen=="BIC" | pen =="EBIC") penalty = log(n)
  if(pen=="AIC") penalty = 2*gamma
  x_int = cbind(1,x)
  nlambda = length(lambda_seq)
  crit = numeric(nlambda)
  for(l in 1:nlambda){
    est_beta = as.numeric(est_beta_matrix[,l])
    probs = logistic_prob(x_int,est_beta)
    pr1 = which(abs(probs-1)<1e-5)
    pr0 = which(abs(probs-0)<1e-5)
    ok = setdiff(1:n,c(pr1,pr0))
    l_current = -sum(y[ok]*log(probs[ok]) + (1-y[ok]) * log(1-probs[ok]))
    par = length(which(est_beta!=0))
    if(pen=="EBIC"){
      crit[l] = 2 * l_current + par * penalty + 2 * gamma * log(choose(p,par))
    }else{
      crit[l] = 2 * l_current + par * penalty
    }
  }
  which_min = which.min(crit)
  lambda_opt = lambda_seq[which_min]
  return(lambda_opt)
}

logistic_prob = function(x,gammab){
  #Pstwa logistyczne
  z = as.numeric(x %*% gammab)
  mask = (z>=0)
  P = numeric(length(z))
  P[mask] = 1.0 / (1.0 + exp(-z[mask]))
  P[!mask] = 1.0 - 1.0 / (1.0 + exp(z[!mask]))
  return(P)
}
