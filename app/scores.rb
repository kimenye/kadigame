require 'httparty'
require 'json'
require 'pry'

class ScoreService
  include HTTParty
  base_uri 'https://www.scoreoid.com/api/'

  def initialize(key, game_id)
    @options = {:api_key => key, :game_id => game_id, :response => "json" }
  end

  def get_user (username="test")
    opts = { :username => username }
    opts.merge!(@options)

    resp = self.class.post('/getPlayer', { :body => opts })
    result = JSON.parse(resp)

    if is_error(result)
      return nil
    else
      return result[0]["Player"]
    end
  end

  def get_users
    resp = self.class.post('/getPlayers', { :body => @options })
    result = JSON.parse(resp)

    if is_error(result)
      return nil
    else
      return result.collect { |p| p["Player"]}
    end
  end

  def create_user(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/createPlayer', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def delete_user(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/deletePlayer', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def create_score(username, points)
    opts = { :username => username, :score => points }
    opts.merge!(@options)
    resp = self.class.post('/createScore', { :body => opts})
    result = JSON.parse(resp)
    is_success(result)
  end

  def calculate_score(username)
    opts = { :username => username }
    opts.merge!(@options)
    resp = self.class.post('/getPlayerScores', { :body => opts})
    result = JSON.parse(resp)

    if !is_error(result)
      total = 0
      scores = result.map { |s| s['Score']['score'].to_i }
      scores.each { |s| total += s }
      return total
    else
      return 0
    end
  end

  def get_player_field(username, field)
    opts = { :username => username, :field => field }
    opts.merge!(@options)
    resp = self.class.post('/getPlayerField', { :body => opts})
    result = JSON.parse(resp)

    if (result.has_key?(field))
      return result[field]
    else
      return nil
    end
  end

  def update_player_field(username, field, value)
    opts = { :username => username, :field => field, :value => value }
    opts.merge!(@options)
    resp = self.class.post('/updatePlayerField', { :body => opts})
    result = JSON.parse(resp)
    return is_success(result)
  end

  def get_time_played(username)
    val = get_player_field(username, "time_played")
    if (val.nil?)
      return 0
    else
      return val.to_i
    end
  end

  def record_win (username)
    old = get_wins(username)
    new = old + 1
    return update_player_field(username, "kills", new)
  end

  def get_wins (username)
    val = get_player_field(username, "kills")
    if (val.nil?)
      return 0
    else
      return val.to_i
    end
  end

  def record_time_played(username, times=1)
    old = get_time_played(username)
    new = old + times
    return update_player_field(username, "time_played", new)
  end

  def is_success(rsp)
    return !is_error(rsp) && rsp.has_key?('success')
  end

  def is_error(rsp)
    return !rsp.kind_of?(Array) && rsp.has_key?('error')
  end
end