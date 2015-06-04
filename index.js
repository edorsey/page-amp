var _ = require('lodash'),
    State = require('ampersand-state'),
    Collection = require('ampersand-collection'),
    page  = require('page'),
    ViewSwitcher = require('ampersand-view-switcher'),
    initialized = false,
    Router;
    
Router = State.extend({
  
  collections: {
    routers: Collection,
  },
  
  props: {
    el: "object",
    views: { 
      required: true,
      type: "object"
    },
    rootPath: {
      type: "string",
      default: ""
    },
    options: "object"
  },
  derived: {
    viewSwitcher: {
      deps: ["el"],
      fn: function() {
        return new ViewSwitcher(this.el);
      }
    }
  },
  
  initialize: function(attrs, options) {
    this.options = options;
    _.bindAll(this);
    page(this._before);
    this.setupRoutes(this.createRouteFn());
    //page(this.render);
    if (!initialized) {
      console.log("HERE");
      //page('*', this.loadView('fourOhFour'), this.render);
      page(options);
      intialized = true;
    }
  },

  setupRoutes: function(r) {
    return new Error("Not Implemented");
  },
  
  loadView: function(view) {
    console.log("LOAD VIEW", view, !this.views[view], this.views)
    var self = this;
    if (!this.views[view]) return this.notFound;
    return function (context, next) {
      console.log("EXEC", view);
      context.view = self.views[view];
      next();
    }
  },
  
  _before: function(context, next) {
    console.log("BEFORE", context);
    this.rendered = false;
    next();
  },
  
  render: function(context, next) {
    console.log("RENDER", context.view, this.rendered, this.switch, this);
    if (!context.view) return next();
    if (this.rendered) return new Error("Calling rendered multiple times!");
    this.switch(new context.view(context));
    this.rendered = true;
  },
  
  switch: function(view) {
    this.trigger('switch', view);
    console.log("SWITCH", view)
    this.viewSwitcher.set(view);
    this.trigger('afterSwitch', view);
  },
  
  createRouteFn: function() {
    var self = this;
    var r = function() {
      var args = Array.prototype.slice.call(arguments);
      if (_.isFunction(args[0])) {
        args = ["*"].concat(args);
      }
      args[0] = self.getPath(args[0]);
      page.apply(self, args);
    };
    
    r.enter = function(path) {
      arguments[0] = self.getPath(arguments[0]);
      page.apply(self, arguments);
    }
    
    r.exit = function(path) {
      arguments[0] = self.getPath(arguments[0]);
      page.exit.apply(self, arguments);
    }
    
    r.prototype.router = function(path, Router) {
      self.registerRouter(path, Router);
    }
    
    return r;
  },
  
  getPath: function(path) {
    if (!path && !this.rootPath) {
      return '/';
    }
    if (!path) {
      return this.rootPath + '/*';
    }
    if (path.indexOf(this.rootPath) === -1) {
      return this.rootPath + path;
    }
    return path;
  },
  
  registerRouter: function(routes, router) {
    var self = this;
    
    if (_.isString(routes) && router) {
      route = routes;
      routes = {}
      routes[route] = router
    }
    
    _.each(routes, function(Router, route) {
      var options = _.assign({ rootPath: route }, self.options);
      self.routers.push(new Router(options));
    });
    
  },
  
  notFound: function() {
    console.log("NOT FOUND");
    return new Error("404 Not Found");
  },
  
  redirect: function(path) {
    return function(context, next) {
      page.redirect(path);
    }
  },
  
  navigate: function(path) {
    if (!_.isString(path)) return new Error("Navigate path must be a string.");
    page(path);
  }
});
    
module.exports = Router;
