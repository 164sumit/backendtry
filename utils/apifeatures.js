class ApiFeatures {
    constructor(query, queryStr,model) {
        this.model=model;
      this.query = query; //gives you product array
      this.queryStr = queryStr;// quary sting like for keyword(name),category,price range(gt,lt)
    }
  
    search() {
      const keyword = this.queryStr.keyword
        ? {
            name: {
              $regex: this.queryStr.keyword,   //for removing case sensetive and half name
              $options: "i",
            },
          }
        : {};
  
      this.query = this.model.find({ ...keyword });
      return this;
    }
  
    filter() {
      const queryCopy = { ...this.queryStr };
      //   Removing some fields for category
      const removeFields = ["keyword", "page", "limit"];
  
      removeFields.forEach((key) => delete queryCopy[key]);
  
      // Filter For Price and Rating
  
      let queryStr = JSON.stringify(queryCopy);
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
  
      this.query = this.query.find(JSON.parse(queryStr));
  
      return this;
    }
  
    pagination(resultPerPage) {
      const currentPage = Number(this.queryStr.page) || 1;
  
      const skip = resultPerPage * (currentPage - 1);
  
      this.query = this.query.limit(resultPerPage).skip(skip);
  
      return this;
    }
  }
  
  module.exports = ApiFeatures;