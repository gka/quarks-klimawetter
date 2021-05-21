# needs('remotes')
# remotes::install_github("retostauffer/Rmosmix")
needs(aiRthermo, ggplot2, tidyverse)
library("mosmix")




mosmix_forecast <- function(station_id, after_date) {
  url <- paste0('https://opendata.dwd.de/weather/local_forecasts/mos/MOSMIX_L/single_stations/', station_id, '/kml/MOSMIX_L_',after_date,'21_',station_id,'.kmz')
  
  kmz   <- tempfile("mosmix_demo_", fileext = ".kmz")
  check <- download.file(url, kmz)
  if ( inherits(check, "try-error") ) stop("Problems downloading the file!")
  kml   <- unzip(kmz)
  
  doc <- XML::xmlParse(kml)
  datetime <- get_datetime(doc)
  meta     <- get_meta_info(doc)
  
  # fcst1 <- get_forecasts(station_id, doc, datetime, meta, as.zoo = T)
  # plot(fcst1)
  
  fcst2 <- get_forecasts(station_id, doc, datetime, meta, as.zoo = F)
  
  # fcst2 %>% ggplot(aes(x=datetime)) +
  #   geom_ribbon(aes(ymin=K2C(TTT-E_TTT), ymax=K2C(TTT+E_TTT)), fill='red', alpha=0.1) +
  #   geom_line(aes(y=K2C(TTT)), color='red') +
  #   geom_ribbon(aes(ymin=K2C(Td-E_Td), ymax=K2C(Td+E_Td)), fill='green', alpha=0.1) +
  #   geom_line(aes(y=K2C(Td)), color='green')
  # 
  # fcst2 %>% ggplot(aes(x=datetime)) +
  #   geom_col(aes(y=RR1c), color='blue')
  
  out <- fcst2 %>%
    mutate(date=format(datetime, '%Y-%m-%d')) %>%
    filter(date>as.Date(after_date, '%Y%m%d')) %>% 
    group_by(date) %>% 
    summarise(Tmin=min(K2C(TTT)), Tmean=mean(K2C(TTT)), Tmax=max(K2C(TTT)), Rsum=sum(RR1c))
  out
}

# mosmix_forecast('10382', '20210505')
