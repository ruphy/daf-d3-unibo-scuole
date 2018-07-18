# Introduction
This reposotory contains a visualization that uses data from the University of Bologna on the different Schools and courses. Data has been downloaded from [the open data portal of the University of Bologna](http://dati.comune.bologna.it/). Two datasets have been merged: a dataset with indicators and a dataset with all courses available at the University of Bologna.

To see the visualization open the index.html file in your browser or go [here](https://esterpantaleo.github.io/daf-d3-unibo-scuole/).

# Data preprocessing
```
path1="./data/indicatori_2017_it.csv"
path2="./data/corsi_2016_it.csv"
mydata1 = read.csv(path1, header=T)
mydata2 = read.csv(path2, header=T)
myfulldata = merge(mydata1, mydata2)
write.table(myfulldata, file = "./data/merged.csv", append = FALSE, quote = TRUE, sep = ",",eol = "\n", na = "NA", dec = ".", row.names = FALSE,col.names = TRUE)
library(rjson)
x <- toJSON(unname(split(myfulldata, 1:nrow(myfulldata))))
fileConn<-file("merged.json")
writeLines(x, fileConn)
close(fileConn)
```
