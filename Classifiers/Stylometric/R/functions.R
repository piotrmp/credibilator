splitDocs=function(k,seed,allY,allS,allT){
  set.seed(seed)
  folds=sample(1:k,length(allY),replace=TRUE)
  return(folds)
}

splitSources=function(k,seed,allY,allS,allT){
  set.seed(seed)
  sources=unique(allS)
  sourcesF=sample(1:k,length(sources),replace=T)
  folds=rep(NA,length(allS))
  for (i in 1:length(sources))
    folds[allS==sources[i]]=sourcesF[i]
  return(folds)
}

splitTopics=function(k,seed,allY,allS,allT){
  set.seed(seed)
  topics=unique(allT)
  topicsF=sample(1:k,length(topics),replace=T)
  folds=rep(NA,length(allT))
  for (i in 1:length(topics))
    folds[allT==topics[i]]=topicsF[i]
  return(folds)
}

foldsRunGLM=function(folds,allX,allY){
  preds=rep(NA,length(allY))
  for (i in 1:max(folds)){
    cat("Working on fold ",i,"\n")
    trainX=allX[folds!=i,]
    trainY=allY[folds!=i]
    cat("Building model...\n")
    model=cv.glmnet(trainX,trainY,family="binomial",parallel=TRUE)
    testX=allX[folds==i,]
    cat("Applying model...\n")
    pred=predict(model,testX,type="response",s="lambda.1se")
    preds[folds==i]=pred
  }
  return(preds)
}

foldsRunGLMFiltered=function(folds,allX,allY,thrs){
  preds=rep(NA,length(allY))
  for (i in 1:max(folds)){
    cat("Working on fold ",i,"\n")
    trainX=allX[folds!=i,]
    trainY=allY[folds!=i]
    cat("Filtering data...\n")
    cors=computeCorrelation(trainX,trainY)
    mask=(abs(cors)<thrs)
    cat("Building model...\n")
    model=cv.glmnet(trainX[,!mask],trainY,family="binomial",parallel=TRUE)
    testX=allX[folds==i,]
    cat("Applying model...\n")
    pred=predict(model,testX[,!mask],type="response",s="lambda.1se")
    cat(mean(allY[folds==i]==(pred>0.5)*1),"\n")
    preds[folds==i]=pred
  }
  return(preds)
}

computeCorrelation=function(trainX,trainY){
  cors=foreach (i=1:ncol(trainX),.combine=c)%dopar%{
    cor(trainX[,i],trainY)
  }
  cors[is.na(cors)]=0
  return(cors)
}
