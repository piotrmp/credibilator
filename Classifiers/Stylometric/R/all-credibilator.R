library(e1071)
library(glmnet)
library(SparseM)
library(Matrix)
source("bic.R")
source("functions.R")
library(foreach)
library(doMC)
registerDoMC(8)

# read data
path="/PATH/TO/FEATURES"
dense=read.table(paste0(path,"train.tsv"),sep = "\t",header=T,quote="",comment.char="")
sparse=as(as.matrix.coo(read.matrix.csr(paste0(path,"train.csr"))$x),"dgCMatrix")
allX=cbind(Matrix(as.matrix(dense[,c(-1,-2,-3)]),sparse=T),sparse)
allY=dense[,1]
allS=dense[,2]
allT=dense[,3]
sparse=NULL

# test performance
k=5
seed=1
folds1=splitDocs(k,seed,allY,allS,allT)
preds1=foldsRunGLMFiltered(folds1,allX,allY,0.05)
mean((preds1>0.5)*1==allY)

folds3=splitSources(k,seed,allY,allS,allT)
preds3=foldsRunGLMFiltered(folds3,allX,allY,0.05)
mean((preds3>0.5)*1==allY)

# build one model
trainX=allX
trainY=allY
testX=allX
testY=allY
cors=computeCorrelation(trainX,trainY)
mask=(abs(cors)<0.05)
model=cv.glmnet(trainX[,!mask],trainY,family="binomial",parallel=TRUE)
pred=predict(model,testX[,!mask],type="response",s="lambda.1se")
mean((pred>0.5)*1==testY)
    
# check important features
medians=apply(trainX, 2, FUN = median)
fnames=c(names(head(dense[,c(-1,-2,-3)])),read.table(paste0(path,"words.tsv"),sep = "\t",header=F,quote="",comment.char="",colClasses = "character",stringsAsFactors=FALSE)$V1)
coefs=rep(NA,length(mask))
coefs[!mask]=model$glmnet.fit$beta[,which(model$glmnet.fit$lambda==model$lambda.1se)]
intercept=model$glmnet.fit$a0[which(model$glmnet.fit$lambda==model$lambda.1se)]
features=data.frame(name=fnames,value=coefs,count=colSums(trainX!=0),median=medians,stringsAsFactors=F)
features[nrow(features) + 1,] = list("<INTERCEPT>",intercept,nrow(allX),1.0)
features=features[!is.na(features$value),]
features=features[features$value!=0,]
features=features[order(-features$value),]
write.table(features,paste0(path,"features.tsv"),quote=FALSE,sep="\t",row.names=FALSE,col.names=FALSE)
