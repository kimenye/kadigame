require 'koala'

class Kadi < Padrino::Application
  use ActiveRecord::ConnectionAdapters::ConnectionManagement
  register Padrino::Rendering
  register Padrino::Mailer
  register Padrino::Helpers


  enable :sessions

  unless ENV["FACEBOOK_APP_ID"] && ENV["FACEBOOK_SECRET"]
    if production?
      abort("missing env vars: please set FACEBOOK_APP_ID and FACEBOOK_SECRET with your app credentials")
    end
  end

  helpers do
    def host
      request.env['HTTP_HOST']
    end

    def scheme
      request.scheme
    end

    def url_no_scheme(path = '')
      "//#{host}#{path}"
    end

    def url(path = '')
      "#{scheme}://#{host}#{path}"
    end

    def authenticator
      @authenticator ||= Koala::Facebook::OAuth.new(ENV["FACEBOOK_APP_ID"], ENV["FACEBOOK_SECRET"], url("/auth/facebook/callback"))
    end
  end

  # the facebook session expired! reset ours and restart the process
  error(Koala::Facebook::APIError) do
    puts ">>> The Facebook Session has expired"
    session[:access_token] = nil
    redirect "/auth/facebook"
  end

  get :index do
    @graph  = Koala::Facebook::API.new(session[:access_token])
    #binding.pry
    #puts ">>> Graph #{@graph}"

    # Get public details of current application
    #@app  =  @graph.get_object(ENV["FACEBOOK_APP_ID"])

    puts ">>> Access token #{session[:access_token]}"

    @token = session[:access_token]

    #If we have a valid access token
    if session[:access_token]
      #read the object from the fb graph
      @user = @graph.get_object("me")

      puts ">> User #{@user}"
      fb_id = @user['id']
      name = @user['name']
      puts ">> FB ID #{fb_id}"

      @player = Player.find_by_fb_id(fb_id)
      puts ">> Player in db #{@player}"

      if @player.nil?
        @player = Player.new({:fb_id => fb_id, :name => name})

        if @player.save
          puts ">>successfully saved to the database"
        else
          puts ">> there was a problem saving that player to the database"
        end
      end

      #@friends = @graph.get_connections('me', 'friends')

      # for other data you can always run fql
      #@friends_using_app = @graph.fql_query("SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1")
    end

    render :index
  end

  post '/player/sync', :provides => [:json] do

    puts ">>> Syncing player with params #{params}"
    @player = Player.find_by_fb_id(params[:fb_id])

    if !@player.nil?
      result = @player.update_attributes({ :roar_id => params[:roar_id], :last_logged_in => Time.now })
      {:success => result}.to_json
    end
  end

  get :test  do
    render "test"
  end

  get '/auth/facebook' do
    session[:access_token] = nil
    redirect authenticator.url_for_oauth_code(:permissions => 'email')
  end

  get '/auth/facebook/callback' do
    session[:access_token] = authenticator.get_access_token(params[:code])
    redirect '/'
  end

  ##
  # Caching support
  #
  # register Padrino::Cache
  # enable :caching
  #
  # You can customize caching store engines:
  #
  #   set :cache, Padrino::Cache::Store::Memcache.new(::Memcached.new('127.0.0.1:11211', :exception_retry_limit => 1))
  #   set :cache, Padrino::Cache::Store::Memcache.new(::Dalli::Client.new('127.0.0.1:11211', :exception_retry_limit => 1))
  #   set :cache, Padrino::Cache::Store::Redis.new(::Redis.new(:host => '127.0.0.1', :port => 6379, :db => 0))
  #   set :cache, Padrino::Cache::Store::Memory.new(50)
  #   set :cache, Padrino::Cache::Store::File.new(Padrino.root('tmp', app_name.to_s, 'cache')) # default choice
  #

  ##
  # Application configuration options
  #
  # set :raise_errors, true       # Raise exceptions (will stop application) (default for test)
  # set :dump_errors, true        # Exception backtraces are written to STDERR (default for production/development)
  # set :show_exceptions, true    # Shows a stack trace in browser (default for development)
  # set :logging, true            # Logging in STDOUT for development and file for production (default only for development)
  # set :public_folder, "foo/bar" # Location for static assets (default root/public)
  # set :reload, false            # Reload application files (default in development)
  # set :default_builder, "foo"   # Set a custom form builder (default 'StandardFormBuilder')
  # set :locale_path, "bar"       # Set path for I18n translations (default your_app/locales)
  # disable :sessions             # Disabled sessions by default (enable if needed)
  # disable :flash                # Disables sinatra-flash (enabled by default if Sinatra::Flash is defined)
  # layout  :my_layout            # Layout can be in views/layouts/foo.ext or views/foo.ext (default :application)
  #

  ##
  # You can configure for a specified environment like:
  #
  #   configure :development do
  #     set :foo, :bar
  #     disable :asset_stamp # no asset timestamping for dev
  #   end
  #

  ##
  # You can manage errors like:
  #
  #   error 404 do
  #     render 'errors/404'
  #   end
  #
  #   error 505 do
  #     render 'errors/505'
  #   end
  #
end
